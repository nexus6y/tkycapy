import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('departments')
export class DeptController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const [items, total] = await Promise.all([this.prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.department.count()]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.department.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { return this.prisma.department.create({ data: dto as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.department.update({ where: { id }, data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.department.delete({ where: { id } }); return { message: '删除成功' }; }
}
