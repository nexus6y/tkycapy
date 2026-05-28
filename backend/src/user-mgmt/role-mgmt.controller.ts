import { Controller, Get, Post, Put, Delete, Param, Query, Body, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('roles-mgmt')
export class RoleMgmtController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const [items, total] = await Promise.all([this.prisma.role.findMany({ orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.role.count()]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id') async findOne(@Param('id') id: string) {
    const item = await this.prisma.role.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('角色不存在');
    return item;
  }

  @Post() async create(@Body() body: { code: string; name: string; description?: string; sortOrder?: number; status?: string }) {
    const tenantId = await this.getTenantId();
    const existing = await this.prisma.role.findFirst({ where: { tenantId, code: body.code } });
    if (existing) throw new ConflictException('角色编码已存在');
    return this.prisma.role.create({ data: { ...body, tenantId, sortOrder: body.sortOrder ?? 0, status: body.status ?? 'ACTIVE' } as any });
  }

  @Put(':id') async update(@Param('id') id: string, @Body() body: { code?: string; name?: string; description?: string; sortOrder?: number; status?: string }) {
    const item = await this.prisma.role.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('角色不存在');
    return this.prisma.role.update({ where: { id }, data: body as any });
  }

  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.role.delete({ where: { id } }); return { message: '删除成功' }; }
}
