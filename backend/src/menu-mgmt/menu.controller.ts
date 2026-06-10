import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';
const M_KEYS = ['code','name','parentId','path','icon','component','sortOrder','type','status','tenantId'];
const P_KEYS = ['roleId','menuId','permission','type','tenantId'];
@Controller('menus-mgmt')
export class MenuMgmtController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll() { return this.prisma.menu.findMany({ orderBy: { sortOrder: 'asc' } }); }
  @Post() async create(@Body() dto: any) {
    const data = pickAllowed(dto, M_KEYS);
    try { return await this.prisma.menu.create({ data: data as any }); }
    catch (e: any) { if (e.code === 'P2002') throw new HttpException('菜单编码已存在', HttpStatus.BAD_REQUEST); throw e; }
  }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.menu.update({ where: { id }, data: pickAllowed(dto, M_KEYS) as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.menu.delete({ where: { id } }); return { message: '删除成功' }; }
}
@Controller('permissions-mgmt')
export class PermissionMgmtController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll() { return this.prisma.permission.findMany({ include: { role: { select: { name: true } } } }); }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.permission.findUnique({ where: { id }, include: { role: { select: { name: true } } } }); }
  @Post() async create(@Body() dto: any) { return this.prisma.permission.create({ data: pickAllowed(dto, P_KEYS) as any }); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.permission.update({ where: { id }, data: pickAllowed(dto, P_KEYS) as any }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.permission.delete({ where: { id } }); return { message: '删除成功' }; }
}
