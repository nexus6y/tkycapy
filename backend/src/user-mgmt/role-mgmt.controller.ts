import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('roles-mgmt')
export class RoleMgmtController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const [items, total] = await Promise.all([this.prisma.role.findMany({ orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.role.count()]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.role.delete({ where: { id } }); return { message: '删除成功' }; }
}
