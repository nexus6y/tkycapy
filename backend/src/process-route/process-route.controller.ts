import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';

const KEYS = ['code','name','bomId','processIds','status','tenantId'];
function clean(dto: any): any { const d = pickAllowed(dto, KEYS); for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }; return d; }

@Controller('process-routes')
export class ProcessRouteController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get() async findAll(@Query('status') s?: string, @Query('code') c?: string, @Query('name') n?: string, @Query('page') page = 1, @Query('pageSize') ps = 30) {
    const tid = await this.tid(); const where: any = { tenantId: tid };
    if (s) where.status = s; if (c) where.code = { contains: c }; if (n) where.name = { contains: n };
    const [items, total] = await Promise.all([this.prisma.processRoute.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +ps, take: +ps }), this.prisma.processRoute.count({ where })]);
    return { items, total, page: +page, pageSize: +ps };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.processRoute.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tid = await this.tid(); const data = clean(dto); data.tenantId = tid; return this.prisma.processRoute.create({ data }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.processRoute.update({ where: { id }, data: clean(dto) }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.processRoute.delete({ where: { id } }); return { message: '删除成功' }; }
}
