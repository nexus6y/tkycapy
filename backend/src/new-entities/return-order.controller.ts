import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";

@Controller("return-orders")
export class ReturnOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get() async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.returnOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.returnOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.returnOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('RET', 'returnOrder', 'orderNo'); return this.prisma.returnOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.returnOrder.update({ where: { id }, data: dto as any }); }
  @Put(":id/submit") async submit(@Param("id") id: string) { return this.prisma.returnOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(":id/approve") async approve(@Param("id") id: string) {
    const order = await this.prisma.returnOrder.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
    const tenantId = await this.tid();
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) {
      const newQty = String((Number(inv.quantity) || 0) + (Number(order.quantity) || 0));
      await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: newQty, availableQty: newQty } });
    } else {
      await this.prisma.inventory.create({ data: { tenantId, materialName: order.materialName || '', warehouseName: order.departmentName || '', quantity: String(order.quantity || 0), availableQty: String(order.quantity || 0), lockedQty: '0' } as any });
    }
    // Auto-transition production: back to ISSUING (allow re-issuing after return)
    if (order.productionOrderId) {
      const prod = await this.prisma.productionOrder.findUnique({ where: { id: order.productionOrderId } });
      if (prod && prod.businessStatus === 'IN_PRODUCTION') {
        await this.prisma.productionOrder.update({ where: { id: order.productionOrderId }, data: { businessStatus: 'ISSUING' } as any });
      }
    }
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '退料入库', materialName: order.materialName, quantity: String(order.quantity || 0), transactionDate: new Date() } as any });
    return order;
  }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.returnOrder.delete({ where: { id } }); return { message: "删除成功" }; }
}
