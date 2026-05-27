import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('transfer-orders')
export class TransferOrderController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('type') type?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (type) where.type = type;
    const [items, total] = await Promise.all([this.prisma.transferOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.transferOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.transferOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.transferOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id/submit') async submit(@Param('id') id: string) { return this.prisma.transferOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.transferOrder.update({ where: { id }, data: dto as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await this.prisma.transferOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const tenantId = await this.tid();
    // Decrease from-warehouse inventory
    const fromInv = await this.prisma.inventory.findFirst({ where: { warehouseName: order.fromWarehouse || '', materialName: order.materialName || '' } });
    if (fromInv) {
      const newQty = String(Math.max(0, (Number(fromInv.quantity) || 0) - (Number(order.quantity) || 0)));
      await this.prisma.inventory.update({ where: { id: fromInv.id }, data: { quantity: newQty, availableQty: newQty } });
    }
    // Increase to-warehouse inventory
    const toInv = await this.prisma.inventory.findFirst({ where: { warehouseName: order.toWarehouse || '', materialName: order.materialName || '' } });
    if (toInv) {
      const newQty = String((Number(toInv.quantity) || 0) + (Number(order.quantity) || 0));
      await this.prisma.inventory.update({ where: { id: toInv.id }, data: { quantity: newQty, availableQty: newQty } });
    } else {
      await this.prisma.inventory.create({ data: { tenantId, materialName: order.materialName || '', warehouseName: order.toWarehouse || '', quantity: String(order.quantity || 0), availableQty: String(order.quantity || 0), lockedQty: '0' } as any });
    }
    // Cost ledger: 调拨出 + 调拨入
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo + '-OUT', transactionType: '调拨出', materialName: order.materialName, quantity: String(order.quantity || 0), totalAmount: '0', transactionDate: new Date() } as any });
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo + '-IN', transactionType: '调拨入', materialName: order.materialName, quantity: String(order.quantity || 0), totalAmount: '0', transactionDate: new Date() } as any });
    return order;
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.transferOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
