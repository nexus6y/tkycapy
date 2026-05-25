import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('dictionaries')
export class DictController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const [items, total] = await Promise.all([this.prisma.dictionary.findMany({ orderBy: { sortOrder: 'asc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.dictionary.count()]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.dictionary.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { return this.prisma.dictionary.create({ data: dto as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.dictionary.update({ where: { id }, data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.dictionary.delete({ where: { id } }); return { message: '删除成功' }; }
}
