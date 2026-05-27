import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("complete-reports")
export class CompleteReportController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get() async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.reportNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.completeReport.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.completeReport.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.completeReport.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.completeReport.create({ data: { ...dto, tenantId } as any }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.completeReport.update({ where: { id }, data: dto as any }); }
  @Put(":id/approve") async approve(@Param("id") id: string) {
    const order = await this.prisma.completeReport.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
    const tenantId = await this.tid();
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) {
      const newQty = String((Number(inv.quantity) || 0) + (Number(order.actualQty) || 0));
      await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: newQty, availableQty: newQty } });
    } else {
      await this.prisma.inventory.create({ data: { tenantId, materialName: order.materialName || '', warehouseName: order.deptName || '', quantity: String(order.actualQty || 0), availableQty: String(order.actualQty || 0), lockedQty: '0' } as any });
    }
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.reportNo, transactionType: '产品入库', materialName: order.materialName, quantity: String(order.actualQty || 0), transactionDate: new Date() } as any });
        // Auto-transition production order: PENDING_STOCK → COMPLETED
    if (order.productionOrderId) {
      const prod = await this.prisma.productionOrder.findUnique({ where: { id: order.productionOrderId } });
      if (prod && prod.businessStatus === 'PENDING_STOCK') {
        await this.prisma.productionOrder.update({ where: { id: order.productionOrderId }, data: { businessStatus: 'COMPLETED' } as any });
      }
    }
    return order;
  }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.completeReport.delete({ where: { id } }); return { message: "删除成功" }; }
}
