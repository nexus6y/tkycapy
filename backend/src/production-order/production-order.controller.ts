import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

@Controller('production-orders')
export class ProductionOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('biz') biz?: string, @Query('code') code?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (biz) where.businessStatus = biz; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } }, materials: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.productionOrder.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.productionOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } }, materials: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('PROD', 'productionOrder', 'orderNo');
    const { lines, materials, ...orderData } = dto;
    const data: any = { ...orderData, tenantId, businessStatus: 'PENDING_ISSUE' };

    if (lines && Array.isArray(lines) && lines.length > 0) {
      data.lines = { create: lines.map((l: any, i: number) => ({
        tenantId, lineNo: l.lineNo ?? i + 1,
        materialCode: l.materialCode, materialName: l.materialName,
        spec: l.spec, unit: l.unit,
        plannedQty: l.plannedQty != null ? String(l.plannedQty) : null,
        warehouseCode: l.warehouseCode,
      })) };
    }
    if (materials && Array.isArray(materials) && materials.length > 0) {
      data.materials = { create: materials.map((l: any, i: number) => ({
        tenantId, lineNo: l.lineNo ?? i + 1,
        materialCode: l.materialCode, materialName: l.materialName,
        spec: l.spec, unit: l.unit,
        quantity: l.quantity != null ? String(l.quantity) : null,
        warehouseCode: l.warehouseCode,
      })) };
    }

    return this.prisma.productionOrder.create({ data, include: { lines: true, materials: true } });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, materials, ...orderData } = dto;
    if (lines !== undefined) {
      await this.prisma.productionOrderLine.deleteMany({ where: { productionOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.productionOrderLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, productionOrderId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            plannedQty: l.plannedQty != null ? String(l.plannedQty) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }
    if (materials !== undefined) {
      await this.prisma.productionMaterialLine.deleteMany({ where: { productionOrderId: id } });
      if (materials.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.productionMaterialLine.createMany({
          data: materials.map((l: any, i: number) => ({
            tenantId, productionOrderId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }
    return this.prisma.productionOrder.update({
      where: { id }, data: orderData as any,
      include: { lines: { orderBy: { lineNo: 'asc' } }, materials: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    await guardWithdraw(this.prisma, 'productionOrder', id);
    return this.prisma.productionOrder.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.productionOrderLine.deleteMany({ where: { productionOrderId: id } });
    await this.prisma.productionMaterialLine.deleteMany({ where: { productionOrderId: id } });
    await this.prisma.productionOrder.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'productionOrder', id);
    return this.prisma.productionOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'productionOrder', id);
    return this.prisma.productionOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'PENDING_ISSUE' } as any });
  }

  // Push-down: generate issue order from production material lines
  @Post(':id/generate-issue')
  async generateIssue(@Param('id') id: string) {
    const order = await this.prisma.productionOrder.findUniqueOrThrow({
      where: { id },
      include: { materials: { orderBy: { lineNo: 'asc' } } },
    });

    if (order.approvalStatus !== 'APPROVED') throw new BadRequestException('只能从已审批的生产订单生成领料单');
    if (!order.materials || order.materials.length === 0) throw new BadRequestException('生产订单没有材料明细');

    const tenantId = await this.tid();
    const issNo = await this.codeGen.generate('ISS', 'issueOrder', 'orderNo');

    await this.prisma.issueOrder.create({
      data: {
        tenantId,
        orderNo: issNo,
        productionOrderId: id,
        productionOrderNo: order.orderNo,
        materialName: order.materials[0].materialName || order.orderName,
        departmentId: order.departmentId,
        departmentName: order.departmentName,
        quantity: String(order.materials.reduce((s, m) => s + Number(m.quantity || 0), 0)),
        approvalStatus: 'DRAFT',
        businessStatus: 'PENDING',
        lines: {
          create: order.materials.map((m, i) => ({
            tenantId,
            lineNo: m.lineNo ?? i + 1,
            materialCode: m.materialCode || '',
            materialName: m.materialName || '',
            spec: m.spec || '',
            unit: m.unit || '',
            quantity: m.quantity != null ? String(m.quantity) : '0',
            warehouseCode: m.warehouseCode || '',
          })),
        },
      } as any,
    });

    // Transition to ISSUING
    await this.prisma.productionOrder.update({
      where: { id },
      data: { businessStatus: 'ISSUING' } as any,
    });

    return { message: '领料单已生成', issueNo: issNo };
  }

  // Push-down: generate complete report from production product lines
  @Post(':id/generate-complete-report')
  async generateCompleteReport(@Param('id') id: string) {
    const order = await this.prisma.productionOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    if (order.approvalStatus !== 'APPROVED') throw new BadRequestException('只能从已审批的生产订单生成完工报告');
    if (!order.lines || order.lines.length === 0) throw new BadRequestException('生产订单没有产品明细');

    const tenantId = await this.tid();
    const rptNo = await this.codeGen.generate('RPT', 'completeReport', 'reportNo');

    // Calculate total from lines
    const totalQty = order.lines.reduce((s, l) => s + Number(l.plannedQty || 0), 0);

    await this.prisma.completeReport.create({
      data: {
        tenantId,
        reportNo: rptNo,
        sourceType: 'PRODUCTION_ORDER',
        productionOrderId: id,
        productionOrderNo: order.orderNo,
        materialCode: order.lines[0]?.materialCode || '',
        materialName: order.lines[0]?.materialName || order.orderName,
        spec: order.lines[0]?.spec || '',
        unit: order.lines[0]?.unit || '',
        plannedQty: String(totalQty),
        actualQty: String(totalQty),
        deptName: order.departmentName,
        approvalStatus: 'DRAFT',
        businessStatus: 'PENDING',
        lines: {
          create: order.lines.map((l, i) => ({
            tenantId,
            lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode || '',
            materialName: l.materialName || '',
            spec: l.spec || '',
            unit: l.unit || '',
            plannedQty: l.plannedQty != null ? String(l.plannedQty) : '0',
            actualQty: l.plannedQty != null ? String(l.plannedQty) : '0',
            warehouseCode: l.warehouseCode || '',
          })),
        },
      } as any,
    });

    return { message: '完工报告已生成', reportNo: rptNo };
  }
}
