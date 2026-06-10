import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";
import { pickAllowed } from "../common/dto-normalizer";

const KEYS = ['orderNo','productionOrderId','productionOrderNo','materialId','materialName','spec','quantity','departmentId','departmentName','returnDate','returnReason','approvalStatus','businessStatus','remark','tenantId'];
function clean(d: any): any { const r = pickAllowed(d, KEYS); for (const k of Object.keys(r)) { if (r[k] === '' || r[k] === null) delete r[k]; }; if (r.returnDate) r.returnDate = new Date(r.returnDate); if (r.quantity != null) r.quantity = String(r.quantity); return r; }

@Controller("return-orders")
export class ReturnOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }
  @Get() async findAll(@Query("status") s?: string, @Query("code") c?: string, @Query("page") p = 1, @Query("pageSize") ps = 30) {
    const tid = await this.tid(); const where: any = { tenantId: tid };
    if (s) where.approvalStatus = s; if (c) where.orderNo = { contains: c };
    const [items, total] = await Promise.all([this.prisma.returnOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+p-1)*+ps, take: +ps }), this.prisma.returnOrder.count({ where })]);
    return { items, total, page: +p, pageSize: +ps };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.returnOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tid = await this.tid(); const data = clean(dto); data.tenantId = tid; if (!data.orderNo) data.orderNo = await this.codeGen.generate('RET', 'returnOrder', 'orderNo'); return this.prisma.returnOrder.create({ data }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.returnOrder.update({ where: { id }, data: clean(dto) }); }
  @Put(":id/submit") async submit(@Param("id") id: string) { return this.prisma.returnOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(":id/approve") async approve(@Param("id") id: string) {
    const order = await this.prisma.returnOrder.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
    const tid = await this.tid();
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) { const nq = String((Number(inv.quantity)||0)+(Number(order.quantity)||0)); await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: nq, availableQty: nq } }); }
    else { await this.prisma.inventory.create({ data: { tenantId: tid, materialName: order.materialName||'', warehouseName: order.departmentName||'', quantity: String(order.quantity||0), availableQty: String(order.quantity||0), lockedQty: '0' } as any }); }
    if (order.productionOrderId) { const prod = await this.prisma.productionOrder.findUnique({ where: { id: order.productionOrderId } }); if (prod?.businessStatus === 'IN_PRODUCTION') { await this.prisma.productionOrder.update({ where: { id: order.productionOrderId }, data: { businessStatus: 'ISSUING' } as any }); } }
    await this.prisma.costLedger.create({ data: { tenantId: tid, transactionNo: order.orderNo, transactionType: '退料入库', materialName: order.materialName, quantity: String(order.quantity||0), transactionDate: new Date() } as any });
    return order;
  }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.returnOrder.delete({ where: { id } }); return { message: "删除成功" }; }
}
