import { Controller, Get, Post, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';

const UOM_KEYS = ['code','name','symbol','sortOrder','status','tenantId'];

function clean(dto: any): any {
  const d = pickAllowed(dto, UOM_KEYS);
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }
  return d;
}

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
  async create(@Body() dto: any) {
    const tenantId = await this.getTenantId();
    const data = clean(dto);
    data.tenantId = tenantId;
    try {
      return await this.prisma.measurementUnit.create({ data: data as any });
    } catch (e: any) {
      if (e.code === 'P2002') throw new HttpException('计量单位编码已存在', HttpStatus.BAD_REQUEST);
      throw e;
    }
  }
}
