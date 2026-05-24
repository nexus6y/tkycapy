import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('contracts')
export class ContractController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string,
    @Query('name') name?: string, @Query('type') type?: string,
    @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const tenantId = await this.getTenantId();
    const where: any = { tenantId };
    if (status) where.approvalStatus = status;
    if (code) where.code = { contains: code };
    if (name) where.name = { contains: name };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
      this.prisma.contract.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.getTenantId();
    return this.prisma.contract.create({ data: { ...dto, tenantId } as any });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.prisma.contract.update({ where: { id }, data: dto as any });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.contract.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    return this.prisma.contract.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    return this.prisma.contract.update({ where: { id }, data: { approvalStatus: 'WITHDRAWN' } as any });
  }
}
