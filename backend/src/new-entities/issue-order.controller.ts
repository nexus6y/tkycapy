import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("issue-orders")
export class IssueOrderController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get() async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.issueOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.issueOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.issueOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.issueOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.issueOrder.update({ where: { id }, data: dto as any }); }
  @Put(":id/submit") async submit(@Param("id") id: string) { return this.prisma.issueOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(":id/approve") async approve(@Param("id") id: string) {
    const order = await this.prisma.issueOrder.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) {
      const newQty = String(Math.max(0, (Number(inv.quantity) || 0) - (Number(order.quantity) || 0)));
      await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: newQty, availableQty: newQty } });
    }
    const tenantId = await this.tid();
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '领料出库', materialName: order.materialName, quantity: String(order.quantity || 0), transactionDate: new Date() } as any });
    return order;
  }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.issueOrder.delete({ where: { id } }); return { message: "删除成功" }; }
}
