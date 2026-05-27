import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit } from '../common/business-rules.helper';
@Controller('inbound-orders')
export class InboundOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.inboundOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.inboundOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.inboundOrder.findUniqueOrThrow({ where: { id } });

  }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('IN', 'inboundOrder', 'orderNo'); return this.prisma.inboundOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.inboundOrder.update({ where: { id }, data: dto as any }); }
  @Put(':id/submit') async submit(@Param('id') id: string) { await guardSubmit(this.prisma, 'inboundOrder', id); return this.prisma.inboundOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await this.prisma.inboundOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'RECEIVED' } as any });
    // Update or create inventory record
    const tenantId = await this.tid();
    const existing = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '', warehouseName: order.warehouseName || '' } });
    const addQty = String(Number(order.qualifiedQty) || Number(order.quantity) || 0);
    if (existing) {
      const newQty = String((Number(existing.quantity) || 0) + Number(addQty));
      const newAvail = String((Number(existing.availableQty) || 0) + Number(addQty));
      await this.prisma.inventory.update({ where: { id: existing.id }, data: { quantity: newQty, availableQty: newAvail } });
    } else {
      await this.prisma.inventory.create({ data: { tenantId, materialName: order.materialName || '', warehouseName: order.warehouseName || '', quantity: addQty, availableQty: addQty, lockedQty: '0' } as any });
    }
    // Write cost ledger entry
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '入库', materialName: order.materialName, quantity: String(order.qualifiedQty || order.quantity || 0), unitPrice: String(order.unitPrice || 0), totalAmount: String(order.totalAmount || 0), transactionDate: new Date() } as any });
    return order;
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.inboundOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
