import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { pickAllowed } from '../common/dto-normalizer';

const PRJ_KEYS = ['code','name','source','organizationId','approvalStatus','tenantId'];

@Controller('projects')
export class ProjectController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async getTenantId() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const tenantId = await this.getTenantId(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.code = { contains: code }; if (name) where.name = { contains: name };
    const [items, total] = await Promise.all([this.prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.project.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.project.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) {
    const tenantId = await this.getTenantId();
    const data = pickAllowed(dto, PRJ_KEYS);
    data.tenantId = tenantId;
    for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
    if (!data.code) data.code = await this.codeGen.generate('PRJ', 'project', 'code');
    try {
      return await this.prisma.project.create({ data: data as any });
    } catch (e: any) {
      if (e.code === 'P2002') throw new HttpException('项目编码已存在', HttpStatus.BAD_REQUEST);
      throw e;
    }
  }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) {
    const data = pickAllowed(dto, PRJ_KEYS);
    for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
    return this.prisma.project.update({ where: { id }, data: data as any });
  }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.project.delete({ where: { id } }); return { message: '删除成功' }; }
  @Put(':id/submit') async submit(@Param('id') id: string) { return this.prisma.project.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
}
