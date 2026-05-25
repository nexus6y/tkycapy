import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('menus-mgmt')
export class MenuMgmtController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll() { return this.prisma.menu.findMany({ orderBy: { sortOrder: 'asc' } }); }
  @Post() async create(@Body() dto: any) { return this.prisma.menu.create({ data: dto as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.menu.update({ where: { id }, data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.menu.delete({ where: { id } }); return { message: '删除成功' }; }
}
@Controller('permissions-mgmt')
export class PermissionMgmtController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll() { return this.prisma.permission.findMany({ include: { role: { select: { name: true } } } }); }
  @Post() async create(@Body() dto: any) { return this.prisma.permission.create({ data: dto as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.permission.delete({ where: { id } }); return { message: '删除成功' }; }
}
