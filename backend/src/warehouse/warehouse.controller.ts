import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('warehouses')
export class WarehouseController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where = { tenantId };
    const [items, total] = await Promise.all([this.prisma.warehouse.findMany({ where, orderBy: { sortOrder: 'asc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.warehouse.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.warehouse.findUniqueOrThrow({ where: { id } });
  }
  }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.warehouse.create({ data: { ...dto, tenantId } as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.warehouse.update({ where: { id }, data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.warehouse.delete({ where: { id } }); return { message: '删除成功' }; }
}
