import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit } from '../common/business-rules.helper';
@Controller('outbound-orders')
export class OutboundOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
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
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('OUT', 'outboundOrder', 'orderNo'); return this.prisma.outboundOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.outboundOrder.update({ where: { id }, data: dto as any }); }
  @Put(':id/submit') async submit(@Param('id') id: string) { await guardSubmit(this.prisma, 'outboundOrder', id); return this.prisma.outboundOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await this.prisma.outboundOrder.findUniqueOrThrow({ where: { id } });
    if (order.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能审批已提交的出库单');
    // Stock validation
    const qty = Number(order.quantity) || 0;
    if (qty > 0) {
      const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '', warehouseName: order.warehouseName || '' } });
      if (!inv || Number(inv.availableQty) < qty) throw new BadRequestException(`库存不足: 可用${inv ? Number(inv.availableQty) : 0}, 需要${qty}`);
    }
    await this.prisma.outboundOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'SHIPPED' } as any });
    // Update inventory: decrease
    const existing = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '', warehouseName: order.warehouseName || '' } });
    if (existing) {
      const newQty = String(Math.max(0, (Number(existing.quantity) || 0) - (Number(order.quantity) || 0)));
      const newAvail = String(Math.max(0, (Number(existing.availableQty) || 0) - (Number(order.quantity) || 0)));
      await this.prisma.inventory.update({ where: { id: existing.id }, data: { quantity: newQty, availableQty: newAvail } });
    }
    // Calculate weighted average cost from ALL inbound entries for this material
    const tenantId = await this.tid();
    const outQty = Number(order.quantity || 0);
    let unitCost = Number(order.unitPrice || 0);
    if (!unitCost && order.materialName) {
      const allInbound = await this.prisma.costLedger.findMany({
        where: { materialName: order.materialName, transactionType: '入库' },
        orderBy: { createdAt: 'desc' },
      });
      if (allInbound.length > 0) {
        const totalQty = allInbound.reduce((s, e) => s + Number(e.quantity || 0), 0);
        const totalAmt = allInbound.reduce((s, e) => s + Number(e.totalAmount || 0), 0);
        unitCost = totalQty > 0 ? totalAmt / totalQty : 0;
      }
    }
    const outAmount = outQty * unitCost;
    // Write cost ledger entry
    await this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '出库', materialName: order.materialName, quantity: String(outQty), unitPrice: String(unitCost), totalAmount: String(outAmount), transactionDate: new Date() } as any });
    // Update outbound order with calculated amount
    await this.prisma.outboundOrder.update({ where: { id }, data: { totalAmount: String(outAmount) } as any });
    return order;
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.outboundOrder.delete({ where: { id } }); return { message: '删除成功' }; }
}
