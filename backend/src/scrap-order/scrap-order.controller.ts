import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { guardSubmit, guardApprove } from '../common/business-rules.helper';
@Controller('scrap-orders')
export class ScrapOrderController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where = { tenantId };
    const [items, total] = await Promise.all([this.prisma.scrapOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.scrapOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.scrapOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.scrapOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.scrapOrder.update({ where: { id }, data: dto as any }); }
  @Put(':id/submit') async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'scrapOrder', id); return this.prisma.scrapOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'scrapOrder', id);
    await this.prisma.scrapOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    // Decrease inventory
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) {
      const newQty = String(Math.max(0, (Number(inv.quantity) || 0) - (Number(order.quantity) || 0)));
      await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: newQty, availableQty: newQty } });
    }
    return order;
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.scrapOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
