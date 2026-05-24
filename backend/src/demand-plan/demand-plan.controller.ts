import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('demand-plans')
export class DemandPlanController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.planNo = { contains: code }; if (name) where.planName = { contains: name };
    const [items, total] = await Promise.all([this.prisma.demandPlan.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.demandPlan.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.demandPlan.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.demandPlan.update({ where: { id }, data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.demandPlan.delete({ where: { id } }); return { message: '删除成功' }; }
  @Put(':id/submit') async submit(@Param('id') id: string) { return this.prisma.demandPlan.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
}
