import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';
const D_KEYS = ['code','name','parentId','sequNo','sortOrder','status','tenantId'];
@Controller('departments')
export class DeptController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const [items, total] = await Promise.all([this.prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.department.count()]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.department.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) {
    const tid = await this.tid();
    const data = { ...pickAllowed(dto, D_KEYS), tenantId: tid };
    try { return await this.prisma.department.create({ data: data as any }); }
    catch (e: any) { if (e.code === 'P2002') throw new HttpException('部门编码已存在', HttpStatus.BAD_REQUEST); throw e; }
  }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.department.update({ where: { id }, data: pickAllowed(dto, D_KEYS) as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.department.delete({ where: { id } }); return { message: '删除成功' }; }
}
