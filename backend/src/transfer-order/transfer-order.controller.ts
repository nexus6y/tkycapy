import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';
import { pickAllowed } from '../common/dto-normalizer';
const KEYS = ['orderNo','type','materialId','materialCode','materialName','spec','unit','quantity','fromWarehouse','fromWarehouseId','fromWarehouseCode','toWarehouse','toWarehouseId','toWarehouseCode','approvalStatus','businessStatus','transferDate','remark','tenantId'];
function clean(d: any): any { const r = pickAllowed(d, KEYS); for (const k of Object.keys(r)) { if (r[k] === '' || r[k] === null) delete r[k]; }; if (r.transferDate) r.transferDate = new Date(r.transferDate); if (r.quantity != null) r.quantity = String(r.quantity); return r; }
@Controller('transfer-orders')
export class TransferOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('type') type?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tid = await this.tid(); const where: any = { tenantId: tid };
    if (type) where.type = type;
    const [items, total] = await Promise.all([this.prisma.transferOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.transferOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.transferOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tid = await this.tid(); const data = clean(dto); data.tenantId = tid; if (!data.orderNo) data.orderNo = await this.codeGen.generate('TR', 'transferOrder', 'orderNo'); return this.prisma.transferOrder.create({ data }); }
  @Put(':id/submit') async submit(@Param('id') id: string) { await guardSubmit(this.prisma, 'transferOrder', id); return this.prisma.transferOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.transferOrder.update({ where: { id }, data: clean(dto) }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'transferOrder', id); await this.prisma.transferOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const tid = await this.tid();
    const fromInv = await this.prisma.inventory.findFirst({ where: { warehouseName: order.fromWarehouse||'', materialName: order.materialName||'' } });
    if (fromInv) { const nq = String(Math.max(0,(Number(fromInv.quantity)||0)-(Number(order.quantity)||0))); await this.prisma.inventory.update({ where: { id: fromInv.id }, data: { quantity: nq, availableQty: nq } }); }
    const toInv = await this.prisma.inventory.findFirst({ where: { warehouseName: order.toWarehouse||'', materialName: order.materialName||'' } });
    if (toInv) { const nq = String((Number(toInv.quantity)||0)+(Number(order.quantity)||0)); await this.prisma.inventory.update({ where: { id: toInv.id }, data: { quantity: nq, availableQty: nq } }); }
    else { await this.prisma.inventory.create({ data: { tenantId: tid, materialName: order.materialName||'', warehouseName: order.toWarehouse||'', quantity: String(order.quantity||0), availableQty: String(order.quantity||0), lockedQty: '0' } as any }); }
    await this.prisma.costLedger.create({ data: { tenantId: tid, transactionNo: order.orderNo+'-OUT', transactionType: '调拨出', materialName: order.materialName, quantity: String(order.quantity||0), totalAmount: '0', transactionDate: new Date() } as any });
    await this.prisma.costLedger.create({ data: { tenantId: tid, transactionNo: order.orderNo+'-IN', transactionType: '调拨入', materialName: order.materialName, quantity: String(order.quantity||0), totalAmount: '0', transactionDate: new Date() } as any });
    return order;
  }
  @Put(':id/withdraw') async withdraw(@Param('id') id: string) { await guardWithdraw(this.prisma, 'transferOrder', id); return this.prisma.transferOrder.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.transferOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
