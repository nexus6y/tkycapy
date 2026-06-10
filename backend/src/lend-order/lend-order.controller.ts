import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { pickAllowed } from '../common/dto-normalizer';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

const KEYS = ['orderNo','type','materialId','materialCode','materialName','spec','unit','quantity','borrower','borrowDate','expectedReturn','actualReturn','approvalStatus','businessStatus','remark','tenantId'];
function clean(dto: any): any { const d = pickAllowed(dto, KEYS); for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }; if (d.borrowDate) d.borrowDate = new Date(d.borrowDate); if (d.expectedReturn) d.expectedReturn = new Date(d.expectedReturn); if (d.actualReturn) d.actualReturn = new Date(d.actualReturn); if (d.quantity != null) d.quantity = String(d.quantity); return d; }

@Controller('lend-orders')
export class LendOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tid = await this.tid(); const where = { tenantId: tid };
    const [items, total] = await Promise.all([this.prisma.lendOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.lendOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.lendOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tid = await this.tid(); const data = clean(dto); if (!data.orderNo) data.orderNo = await this.codeGen.generate('LEND', 'lendOrder', 'orderNo'); data.tenantId = tid; return this.prisma.lendOrder.create({ data }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.lendOrder.update({ where: { id }, data: clean(dto) }); }
  @Put(':id/submit') async submit(@Param('id') id: string) { return this.prisma.lendOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'lendOrder', id);
    await this.prisma.lendOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) { const q = Number(order.quantity)||0; const a = Math.max(0,(Number(inv.availableQty)||0)-q); const l = (Number(inv.lockedQty)||0)+q; await this.prisma.inventory.update({ where: { id: inv.id }, data: { availableQty: String(a), lockedQty: String(l) } }); }
    return order;
  }
  @Put(':id/return') async returnLend(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'lendOrder', id);
    await this.prisma.lendOrder.update({ where: { id }, data: { actualReturn: new Date(), businessStatus: 'RETURNED' } as any });
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) { const q = Number(order.quantity)||0; const a = (Number(inv.availableQty)||0)+q; const l = Math.max(0,(Number(inv.lockedQty)||0)-q); await this.prisma.inventory.update({ where: { id: inv.id }, data: { availableQty: String(a), lockedQty: String(l) } }); }
    return order;
  }
  @Put(':id/withdraw') async withdraw(@Param('id') id: string) { await guardWithdraw(this.prisma, 'lendOrder', id); return this.prisma.lendOrder.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.lendOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
