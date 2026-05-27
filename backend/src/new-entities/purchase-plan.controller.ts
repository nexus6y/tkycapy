import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("purchase-plans")
export class PurchasePlanController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get() async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.purchasePlan.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.purchasePlan.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.purchasePlan.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.purchasePlan.create({ data: { ...dto, tenantId } as any }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.purchasePlan.update({ where: { id }, data: dto as any }); }
  @Put(":id/submit") async submit(@Param("id") id: string) { return this.prisma.purchasePlan.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(":id/approve") async approve(@Param("id") id: string) {
    const plan = await this.prisma.purchasePlan.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
    const tenantId = await this.tid();
    // Auto-create purchase order (via sales-orders as proxy)
    await this.prisma.salesOrder.create({ data: {
      tenantId, orderNo: 'PO-' + plan.orderNo, orderName: plan.orderName, customerName: plan.supplierName,
      approvalStatus: 'DRAFT',
    } as any });
    return plan;
  }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.purchasePlan.delete({ where: { id } }); return { message: "删除成功" }; }
}
