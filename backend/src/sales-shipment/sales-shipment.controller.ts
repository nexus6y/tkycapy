import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { guardSubmit, guardApprove } from '../common/business-rules.helper';
@Controller('sales-shipments')
export class SalesShipmentController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.shipmentNo = { contains: code }; if (name) where.customerName = { contains: name };
    const [items, total] = await Promise.all([this.prisma.salesShipment.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.salesShipment.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.salesShipment.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.salesShipment.update({ where: { id }, data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.salesShipment.delete({ where: { id } }); return { message: '删除成功' }; }
  @Put(':id/submit') async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'salesShipment', id); return this.prisma.salesShipment.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'salesShipment', id);
    await this.prisma.salesShipment.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const tenantId = await this.tid();
    // Auto-create outbound order
    await this.prisma.outboundOrder.create({ data: {
      tenantId, orderNo: 'OUT-' + order.shipmentNo, sourceType: 'SALES_SHIPMENT', sourceNo: order.shipmentNo,
      quantity: String(order.totalQuantity || 0), totalAmount: String(order.totalAmount || 0), approvalStatus: 'DRAFT',
    } as any });
    return order;
  }
}
