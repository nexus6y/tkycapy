import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('users')
export class UserMgmtController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll(@Query('username') username?: string, @Query('name') name?: string, @Query('status') status?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const where: any = {}; if (username) where.username = { contains: username }; if (name) where.name = { contains: name }; if (status) where.status = status;
    const [items, total] = await Promise.all([this.prisma.user.findMany({ where, select: { id:true,username:true,name:true,email:true,phone:true,status:true,lastLoginAt:true,createdAt:true }, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.user.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.user.delete({ where: { id } }); return { message: '删除成功' }; }
}
