import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('measurement-units')
export class MeasurementUnitController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 200) {
    const [items, total] = await Promise.all([
      this.prisma.measurementUnit.findMany({ orderBy: { sortOrder: 'asc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
      this.prisma.measurementUnit.count(),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Post()
  async create(@Body() dto: { code: string; name: string; symbol?: string; sortOrder?: number }) {
    const tenantId = await this.getTenantId();
    return this.prisma.measurementUnit.create({ data: { ...dto, tenantId } });
  }
}
