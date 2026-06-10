import { Controller, Get, Post, Put, Delete, Param, Query, Body, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';

const ROLE_KEYS = ['code','name','description','sortOrder','status','tenantId'];

function clean(dto: any): any {
  const d = pickAllowed(dto, ROLE_KEYS);
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }
  return d;
}

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

  @Post() async create(@Body() body: any) {
    const tenantId = await this.getTenantId();
    const data = clean(body);
    const existing = await this.prisma.role.findFirst({ where: { tenantId, code: data.code } });
    if (existing) throw new ConflictException('角色编码已存在');
    data.tenantId = tenantId;
    if (data.sortOrder == null) data.sortOrder = 0;
    if (!data.status) data.status = 'ACTIVE';
    return this.prisma.role.create({ data: data as any });
  }

  @Put(':id') async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.prisma.role.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('角色不存在');
    const data = clean(body);
    return this.prisma.role.update({ where: { id }, data: data as any });
  }

  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.role.delete({ where: { id } }); return { message: '删除成功' }; }
}
