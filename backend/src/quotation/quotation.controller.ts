import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { guardSubmit, guardApprove } from '../common/business-rules.helper';

@Controller('quotations')
export class QuotationController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string,
    @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.getTenantId();
    const where: any = { tenantId };
    if (status) where.approvalStatus = status;
    if (code) where.quotationNo = { contains: code };
    if (name) where.quotationName = { contains: name };
    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
      this.prisma.quotation.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.getTenantId();
    return this.prisma.quotation.create({ data: { ...dto, tenantId } as any });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.prisma.quotation.update({ where: { id }, data: dto as any });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.quotation.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'quotation', id);
    return this.prisma.quotation.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }
  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'quotation', id);
    await this.prisma.quotation.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const tenantId = await this.getTenantId();
    await this.prisma.preOrder.create({ data: {
      tenantId, orderNo: 'PRE-' + order.quotationNo, orderName: order.quotationName, customerName: order.customerName,
      totalAmount: order.totalAmount, approvalStatus: 'DRAFT',
    } as any });
    return order;
  }
  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    const order = await this.prisma.quotation.findUniqueOrThrow({ where: { id } });
    if (order.approvalStatus !== 'SUBMITTED') throw new Error('只能撤回已提交的报价单');
    return this.prisma.quotation.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }
  @Put(':id/mark-result')
  async markResult(@Param('id') id: string, @Body() dto: { markResult: string }) {
    if (!['WON', 'LOST', 'PENDING'].includes(dto.markResult)) throw new Error('标记结果必须为 WON/LOST/PENDING');
    return this.prisma.quotation.update({ where: { id }, data: { markResult: dto.markResult } as any });
  }
}
