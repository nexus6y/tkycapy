import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('cost-ledgers')
export class CostLedgerController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('type') type?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (type) where.transactionType = type;
    const [items, total] = await Promise.all([this.prisma.costLedger.findMany({ where, orderBy: { transactionDate: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.costLedger.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.costLedger.create({ data: { ...dto, tenantId } as any }); }
}
