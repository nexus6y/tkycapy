import { Controller, Get, Post, Put, Delete, Param, Query, Body, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';
import * as bcrypt from 'bcryptjs';

const USER_KEYS = ['username','password','name','email','phone','departmentId','dataScope','sortOrder','status','tenantId'];

function clean(dto: any): any {
  const d = pickAllowed(dto, USER_KEYS);
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }
  return d;
}

@Controller('users')
export class UserMgmtController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get() async findAll(@Query('username') username?: string, @Query('name') name?: string, @Query('status') status?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const where: any = {}; if (username) where.username = { contains: username }; if (name) where.name = { contains: name }; if (status) where.status = status;
    const [items, total] = await Promise.all([this.prisma.user.findMany({ where, select: { id:true,username:true,name:true,email:true,phone:true,status:true,lastLoginAt:true,createdAt:true }, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.user.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id') async findOne(@Param('id') id: string) {
    const item = await this.prisma.user.findUnique({ where: { id }, select: { id:true,username:true,name:true,email:true,phone:true,status:true,lastLoginAt:true,createdAt:true } });
    if (!item) throw new NotFoundException('用户不存在');
    return item;
  }

  @Post() async create(@Body() body: any) {
    const tenantId = await this.getTenantId();
    const data = clean(body);
    const existing = await this.prisma.user.findFirst({ where: { tenantId, username: data.username } });
    if (existing) throw new ConflictException('用户名已存在');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;
    data.tenantId = tenantId;
    if (!data.status) data.status = 'ACTIVE';
    return this.prisma.user.create({ data: data as any, select: { id:true,username:true,name:true,email:true,phone:true,status:true,createdAt:true } });
  }

  @Put(':id') async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.prisma.user.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('用户不存在');
    const data = clean(body);
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    else delete data.password;
    return this.prisma.user.update({ where: { id }, data: data as any, select: { id:true,username:true,name:true,email:true,phone:true,status:true,createdAt:true } });
  }

  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.user.delete({ where: { id } }); return { message: '删除成功' }; }
}
