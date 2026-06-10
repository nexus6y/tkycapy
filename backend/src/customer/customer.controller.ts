import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';

const CUST_KEYS = ['code','name','industry','valueLevel','creditLevel','contactPerson','contactPhone','contactEmail','address','status','tenantId'];

@Controller('customers')
export class CustomerController {
  constructor(private prisma: PrismaService) {}
  private async getTenantId() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('code') code?: string, @Query('name') name?: string, @Query('status') status?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.getTenantId(); const where: any = { tenantId };
    if (code) where.code = { contains: code }; if (name) where.name = { contains: name }; if (status) where.status = status;
    const [items, total] = await Promise.all([this.prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.customer.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.customer.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) {
    const tenantId = await this.getTenantId();
    const data = pickAllowed(dto, CUST_KEYS);
    data.tenantId = tenantId;
    for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
    try {
      return await this.prisma.customer.create({ data: data as any });
    } catch (e: any) {
      if (e.code === 'P2002') throw new HttpException('客户编码已存在', HttpStatus.BAD_REQUEST);
      throw e;
    }
  }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) {
    const data = pickAllowed(dto, CUST_KEYS);
    for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
    return this.prisma.customer.update({ where: { id }, data: data as any });
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.customer.delete({ where: { id } }); return { message: '删除成功' }; }
}
