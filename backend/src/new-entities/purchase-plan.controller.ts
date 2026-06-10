import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';
import { CodeGeneratorService } from "../common/code-generator.service";
import { pickAllowed } from "../common/dto-normalizer";

const PPL_KEYS = ['orderNo','orderName','demandPlanId','demandPlanNo','supplierId','supplierName','materialName','quantity','requiredDate','approvalStatus','businessStatus','remark','tenantId'];

function cleanPpl(dto: any): any {
  const data = pickAllowed(dto, PPL_KEYS);
  for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
  if (data.quantity != null) data.quantity = String(data.quantity);
  if (data.requiredDate) data.requiredDate = new Date(data.requiredDate);
  return data;
}

@Controller("purchase-plans")
export class PurchasePlanController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get()
  async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30, @Query("mode") mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([
      this.prisma.purchasePlan.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.purchasePlan.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.prisma.purchasePlan.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const data = cleanPpl(dto);
    data.tenantId = tenantId;
    if (!data.orderNo) data.orderNo = await this.codeGen.generate('PPLAN', 'purchasePlan', 'orderNo');
    const { lines, ...orderData } = data;
    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.purchasePlan.create({
        data: {
          ...orderData, tenantId,
          lines: { create: lines.map((l: any, i: number) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            requiredDate: l.requiredDate ? new Date(l.requiredDate) : null,
            warehouseCode: l.warehouseCode,
          })) },
        },
        include: { lines: true },
      } as any);
    }
    return this.prisma.purchasePlan.create({ data: { ...orderData, tenantId } as any });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    const { lines, ...orderData } = dto;
    if (lines !== undefined) {
      await this.prisma.purchasePlanLine.deleteMany({ where: { purchasePlanId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.purchasePlanLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, purchasePlanId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            requiredDate: l.requiredDate ? new Date(l.requiredDate) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }
    return this.prisma.purchasePlan.update({
      where: { id }, data: orderData as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Put(":id/submit")
  async submit(@Param("id") id: string) {
    await guardSubmit(this.prisma, 'purchasePlan', id);
    return this.prisma.purchasePlan.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any });
  }

  @Put(":id/approve")
  async approve(@Param("id") id: string) {
    await guardApprove(this.prisma, 'purchasePlan', id);
    const tenantId = await this.tid();

    return await this.prisma.$transaction(async (tx) => {
      const plan = await tx.purchasePlan.findUniqueOrThrow({
        where: { id },
        include: { lines: { orderBy: { lineNo: 'asc' } } },
      });
      if (plan.approvalStatus !== 'SUBMITTED') throw new Error('只能审批已提交的采购计划');

      // Idempotency: check if purchase order already generated
      const existing = await tx.purchaseOrder.findFirst({
        where: {
          purchasePlanId: id,
          approvalStatus: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
        },
      });
      if (existing) throw new Error(`该采购计划已生成采购订单 ${existing.orderNo}，不能重复审批`);

      await tx.purchasePlan.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });

      const poNo = await this.codeGen.generate('PO', 'purchaseOrder', 'orderNo');
      const totalQty = plan.lines && plan.lines.length > 0
        ? String(plan.lines.reduce((s, l) => s + Number(l.quantity || 0), 0))
        : plan.quantity || '0';

      const poData: any = {
        tenantId, orderNo: poNo, orderName: plan.orderName,
        supplierId: plan.supplierId, supplierName: plan.supplierName,
        purchasePlanId: plan.id, purchasePlanNo: plan.orderNo,
        demandPlanId: plan.demandPlanId, demandPlanNo: plan.demandPlanNo,
        creationType: 'PUSH_FROM_PLAN',
        totalAmount: plan.lines && plan.lines.length > 0
          ? String(plan.lines.reduce((s, l) => s + Number(l.amount || 0), 0))
          : null,
        approvalStatus: 'DRAFT', businessStatus: 'PENDING_RECEIPT',
      };

      if (plan.lines && plan.lines.length > 0) {
        poData.lines = {
          create: plan.lines.map((l, i) => ({
            tenantId,
            lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode || '',
            materialName: l.materialName || '',
            spec: l.spec || '',
            unit: l.unit || '',
            quantity: l.quantity != null ? String(l.quantity) : '0',
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            requiredDate: l.requiredDate,
            warehouseCode: l.warehouseCode || '',
          })),
        };
      }

      await tx.purchaseOrder.create({ data: poData });

      return { message: '采购订单已生成', purchaseOrderNo: poNo };
    });
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    await guardWithdraw(this.prisma, 'purchasePlan', id);
    return this.prisma.purchasePlan.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.purchasePlanLine.deleteMany({ where: { purchasePlanId: id } });
    await this.prisma.purchasePlan.delete({ where: { id } });
    return { message: "删除成功" };
  }
}
