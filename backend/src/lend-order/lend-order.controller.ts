import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { guardSubmit, guardApprove } from '../common/business-rules.helper';
@Controller('lend-orders')
export class LendOrderController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where = { tenantId };
    const [items, total] = await Promise.all([this.prisma.lendOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.lendOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.lendOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.lendOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id/submit') async submit(@Param(':id') id: string) { return this.prisma.lendOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.lendOrder.update({ where: { id }, data: dto as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'lendOrder', id);
    await this.prisma.lendOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    // Lock inventory: decrease availableQty but keep quantity
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) {
      const newAvail = String(Math.max(0, (Number(inv.availableQty) || 0) - (Number(order.quantity) || 0)));
      const newLocked = String((Number(inv.lockedQty) || 0) + (Number(order.quantity) || 0));
      await this.prisma.inventory.update({ where: { id: inv.id }, data: { availableQty: newAvail, lockedQty: newLocked } });
    }
    return order;
  }
  @Put(':id/return') async returnLend(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'lendOrder', id);
    await this.prisma.lendOrder.update({ where: { id }, data: { actualReturn: new Date(), businessStatus: 'RETURNED' } as any });
    // Release inventory: increase availableQty, decrease locked
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) {
      const newAvail = String((Number(inv.availableQty) || 0) + (Number(order.quantity) || 0));
      const newLocked = String(Math.max(0, (Number(inv.lockedQty) || 0) - (Number(order.quantity) || 0)));
      await this.prisma.inventory.update({ where: { id: inv.id }, data: { availableQty: newAvail, lockedQty: newLocked } });
    }
    return order;
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.lendOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
