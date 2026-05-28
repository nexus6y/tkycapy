import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';
@Controller('sales-orders')
export class SalesOrderController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('bizStatus') bizStatus?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (bizStatus) where.businessStatus = bizStatus; if (code) where.orderNo = { contains: code }; if (name) where.orderName = { contains: name };
    const [items, total] = await Promise.all([this.prisma.salesOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.salesOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Post() async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const data: any = { ...dto, tenantId };
    if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
    if (data.orderDate) data.orderDate = new Date(data.orderDate);
    if (data.totalAmount != null && data.totalAmount !== '') data.totalAmount = String(data.totalAmount);
    else delete data.totalAmount;
    return this.prisma.salesOrder.create({ data });
  }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) {
    const data: any = { ...dto };
    if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
    if (data.orderDate) data.orderDate = new Date(data.orderDate);
    if (data.totalAmount != null && data.totalAmount !== '') data.totalAmount = String(data.totalAmount);
    else delete data.totalAmount;
    return this.prisma.salesOrder.update({ where: { id }, data });
  }
  @Put(':id/withdraw') async withdraw(@Param('id') id: string) {
    await guardWithdraw(this.prisma, 'salesOrder', id);
    return this.prisma.salesOrder.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.salesOrder.delete({ where: { id } }); return { message: '删除成功' }; }
  @Put(':id/submit') async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'salesOrder', id); return this.prisma.salesOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'salesOrder', id);
    await this.prisma.salesOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const tenantId = await this.tid();
    // Auto-create production order for manufactured goods
    await this.prisma.productionOrder.create({ data: {
      tenantId, orderNo: 'PROD-' + order.orderNo, orderName: '生产-' + order.orderName,
      materialName: order.orderName, quantity: '0', departmentName: '生产部',
      approvalStatus: 'DRAFT',
    } as any });
    return order;
  }
}
