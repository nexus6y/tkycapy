import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";

@Controller("issue-orders")
export class IssueOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get() async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.issueOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.issueOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.issueOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('ISS', 'issueOrder', 'orderNo'); return this.prisma.issueOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.issueOrder.update({ where: { id }, data: dto as any }); }
  @Put(":id/submit") async submit(@Param("id") id: string) { return this.prisma.issueOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(":id/approve") async approve(@Param("id") id: string) {
    const order = await this.prisma.issueOrder.findUniqueOrThrow({ where: { id } });
    if (order.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能审批已提交的领料单');
    const qty = Number(order.quantity) || 0;
    if (qty > 0) {
      const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
      if (!inv || Number(inv.availableQty) < qty) throw new BadRequestException(`库存不足: 可用${inv ? Number(inv.availableQty) : 0}, 需要${qty}`);
    }
    await this.prisma.issueOrder.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) {
      const newQty = String(Math.max(0, (Number(inv.quantity) || 0) - (Number(order.quantity) || 0)));
      await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: newQty, availableQty: newQty } });
    }
    const tenantId = await this.tid();
    let unitCost = 0;
    if (order.materialName) {
      const recentInbound = await this.prisma.costLedger.findMany({
        where: { materialName: order.materialName, transactionType: '入库' },
        orderBy: { createdAt: 'desc' }, take: 5,
      });
      if (recentInbound.length > 0) {
        const totalQty = recentInbound.reduce((s, e) => s + Number(e.quantity || 0), 0);
        const totalAmt = recentInbound.reduce((s, e) => s + Number(e.totalAmount || 0), 0);
        unitCost = totalQty > 0 ? totalAmt / totalQty : 0;
      }
    }
    const issQty = Number(order.quantity || 0);
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '领料出库', materialName: order.materialName, quantity: String(issQty), unitPrice: String(unitCost), totalAmount: String(issQty * unitCost), transactionDate: new Date() } as any });
    // Auto-transition production order: PENDING_ISSUE → ISSUING
    if (order.productionOrderId) {
      const prod = await this.prisma.productionOrder.findUnique({ where: { id: order.productionOrderId } });
      if (prod && prod.businessStatus === 'PENDING_ISSUE') {
        await this.prisma.productionOrder.update({ where: { id: order.productionOrderId }, data: { businessStatus: 'ISSUING' } as any });
      }
    }
    return order;
  }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.issueOrder.delete({ where: { id } }); return { message: "删除成功" }; }
}
