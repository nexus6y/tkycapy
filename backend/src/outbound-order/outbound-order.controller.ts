import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('outbound-orders')
export class OutboundOrderController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.outboundOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.outboundOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.outboundOrder.findUniqueOrThrow({ where: { id } });

  }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.outboundOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.outboundOrder.update({ where: { id }, data: dto as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await this.prisma.outboundOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'SHIPPED' } as any });
    // Update inventory: decrease
    const existing = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '', warehouseName: order.warehouseName || '' } });
    if (existing) {
      const newQty = String(Math.max(0, (Number(existing.quantity) || 0) - (Number(order.quantity) || 0)));
      const newAvail = String(Math.max(0, (Number(existing.availableQty) || 0) - (Number(order.quantity) || 0)));
      await this.prisma.inventory.update({ where: { id: existing.id }, data: { quantity: newQty, availableQty: newAvail } });
    }
    // Write cost ledger entry
    const tenantId = await this.tid();
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '出库', materialName: order.materialName, quantity: String(order.quantity || 0), unitPrice: String(order.unitPrice || 0), totalAmount: String(order.totalAmount || 0), transactionDate: new Date() } as any });
    return order;
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.outboundOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
