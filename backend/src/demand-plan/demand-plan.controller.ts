import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

@Controller('demand-plans')
export class DemandPlanController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.planNo = { contains: code }; if (name) where.planName = { contains: name };
    const [items, total] = await Promise.all([
      this.prisma.demandPlan.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.demandPlan.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.demandPlan.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const { lines, ...orderData } = dto;
    const data: any = { ...orderData, tenantId };
    if (data.requiredDate) data.requiredDate = new Date(data.requiredDate);
    if (data.totalQuantity != null && data.totalQuantity !== '') data.totalQuantity = String(data.totalQuantity);
    else delete data.totalQuantity;

    if (!data.planNo) data.planNo = await this.codeGen.generate('DP', 'demandPlan', 'planNo');

    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.demandPlan.create({
        data: {
          ...data,
          lines: { create: lines.map((l: any, i: number) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            requiredDate: l.requiredDate ? new Date(l.requiredDate) : null,
            warehouseCode: l.warehouseCode,
            remark: l.remark,
          })) },
        },
        include: { lines: true },
      });
    }
    return this.prisma.demandPlan.create({ data });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...orderData } = dto;
    const data: any = { ...orderData };
    if (data.requiredDate) data.requiredDate = new Date(data.requiredDate);
    if (data.totalQuantity != null && data.totalQuantity !== '') data.totalQuantity = String(data.totalQuantity);
    else delete data.totalQuantity;

    if (lines !== undefined) {
      await this.prisma.demandPlanLine.deleteMany({ where: { demandPlanId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.demandPlanLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, demandPlanId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            requiredDate: l.requiredDate ? new Date(l.requiredDate) : null,
            warehouseCode: l.warehouseCode,
            remark: l.remark,
          })),
        });
      }
    }

    return this.prisma.demandPlan.update({
      where: { id }, data,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    await guardWithdraw(this.prisma, 'demandPlan', id);
    return this.prisma.demandPlan.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.demandPlanLine.deleteMany({ where: { demandPlanId: id } });
    await this.prisma.demandPlan.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'demandPlan', id);
    return this.prisma.demandPlan.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'demandPlan', id);
    await this.prisma.demandPlan.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    // NO auto-create purchase plan — user must explicitly push-down via generate-purchase-plan
    return order;
  }

  // Push-down: generate purchase plan from demand plan lines (idempotent)
  @Post(':id/generate-purchase-plan')
  async generatePurchasePlan(@Param('id') id: string) {
    const tenantId = await this.tid();

    return await this.prisma.$transaction(async (tx) => {
      const plan = await tx.demandPlan.findUniqueOrThrow({
        where: { id },
        include: { lines: { orderBy: { lineNo: 'asc' } } },
      });

      if (plan.approvalStatus !== 'APPROVED') throw new BadRequestException('只能从已审批的需求计划生成采购计划');
      if (plan.businessStatus !== 'PENDING') {
        throw new BadRequestException(`当前需求计划业务状态为 ${plan.businessStatus}，不允许下推`);
      }
      if (!plan.lines || plan.lines.length === 0) throw new BadRequestException('需求计划没有明细行');

      // Idempotency: check existing purchase plan linked to this demand plan
      const existing = await tx.purchasePlan.findFirst({
        where: {
          demandPlanId: id,
          approvalStatus: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
        },
      });
      if (existing) throw new BadRequestException(`该需求计划已存在采购计划 ${existing.orderNo}，不能重复下推`);

      const ppNo = await this.codeGen.generate('PPLAN', 'purchasePlan', 'orderNo');
      const totalQty = plan.lines.reduce((s, l) => s + Number(l.quantity || 0), 0);

      await tx.purchasePlan.create({
        data: {
          tenantId,
          orderNo: ppNo,
          orderName: plan.planName,
          demandPlanId: id,
          demandPlanNo: plan.planNo,
          materialName: plan.lines[0]?.materialName || plan.planName,
          quantity: String(totalQty),
          requiredDate: plan.requiredDate,
          approvalStatus: 'DRAFT',
          businessStatus: 'PENDING',
          lines: {
            create: plan.lines.map((l, i) => ({
              tenantId,
              lineNo: l.lineNo ?? i + 1,
              materialCode: l.materialCode || '',
              materialName: l.materialName || '',
              spec: l.spec || '',
              unit: l.unit || '',
              quantity: l.quantity != null ? String(l.quantity) : '0',
              requiredDate: l.requiredDate,
              warehouseCode: l.warehouseCode || '',
            })),
          },
        } as any,
      });

      await tx.demandPlan.update({
        where: { id },
        data: { businessStatus: 'GENERATED' } as any,
      });

      return { message: '采购计划已生成', purchasePlanNo: ppNo };
    });
  }
}
