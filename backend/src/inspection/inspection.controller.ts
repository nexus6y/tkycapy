import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('inspections')
export class InspectionController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.inspectionNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.inspection.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.inspection.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.inspection.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.inspection.update({ where: { id }, data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.inspection.delete({ where: { id } }); return { message: '删除成功' }; }
  @Put(':id/submit') async submit(@Param('id') id: string) { return this.prisma.inspection.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await this.prisma.inspection.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const tenantId = await this.tid();
    // Auto-create inbound order for qualified goods
    await this.prisma.inboundOrder.create({ data: {
      tenantId, orderNo: 'IN-INS-' + order.inspectionNo, sourceType: 'INSPECTION', sourceNo: order.inspectionNo,
      materialName: order.materialName, quantity: String(order.qualifiedQty || 0), qualifiedQty: String(order.qualifiedQty || 0),
      unqualifiedQty: String(order.unqualifiedQty || 0), approvalStatus: 'DRAFT',
    } as any });
    return order;
  }
}
