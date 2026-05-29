import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';
import { CodeGeneratorService } from "../common/code-generator.service";

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
    if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('PPLAN', 'purchasePlan', 'orderNo');
    const { lines, ...orderData } = dto;
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
    const plan = await guardApprove(this.prisma, 'purchasePlan', id);
    await this.prisma.purchasePlan.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
    const tenantId = await this.tid();
    // Auto-create purchase order draft
    const poNo = await this.codeGen.generate('PO', 'purchaseOrder', 'orderNo');
    await this.prisma.purchaseOrder.create({ data: {
      tenantId, orderNo: poNo, orderName: plan.orderName,
      supplierId: plan.supplierId, supplierName: plan.supplierName,
      purchasePlanId: plan.id, purchasePlanNo: plan.orderNo,
      creationType: 'PUSH_FROM_PLAN',
      approvalStatus: 'DRAFT', businessStatus: 'PENDING_RECEIPT',
    } as any });
    return plan;
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
