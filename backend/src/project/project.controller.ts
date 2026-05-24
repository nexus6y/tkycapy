import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('projects')
export class ProjectController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string,
    @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const tenantId = await this.getTenantId();
    const where: any = { tenantId };
    if (status) where.approvalStatus = status;
    if (code) where.code = { contains: code };
    if (name) where.name = { contains: name };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
      this.prisma.project.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.project.findUniqueOrThrow({ where: { id } });
  }

  @Post()
  async create(@Body() dto: { code: string; name: string; source?: string }) {
    const tenantId = await this.getTenantId();
    return this.prisma.project.create({ data: { ...dto, tenantId } as any });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: { name?: string; source?: string }) {
    return this.prisma.project.update({ where: { id }, data: dto as any });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.project.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    return this.prisma.project.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }
}
