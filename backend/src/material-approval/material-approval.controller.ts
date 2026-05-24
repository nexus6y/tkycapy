import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('material-approvals')
export class MaterialApprovalController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string,
    @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const where: any = {};
    if (status) where.approvalStatus = status;
    if (code) where.code = { contains: code };

    const [items, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        include: { category: { select: { code: true, name: true } }, unit: { select: { code: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (+page - 1) * +pageSize, take: +pageSize,
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      items: items.map(i => ({
        ...i, categoryCode: i.category?.code, categoryName: i.category?.name,
        unitCode: i.unit?.code, unitName: i.unit?.name, category: undefined, unit: undefined,
      })),
      total, page: +page, pageSize: +pageSize,
    };
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Body('comment') comment?: string) {
    const data: any = { approvalStatus: 'APPROVED' };
    if (comment) data.remark = comment;
    return this.prisma.material.update({ where: { id }, data });
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string, @Body('comment') comment?: string) {
    const data: any = { approvalStatus: 'REJECTED' };
    if (comment) data.remark = comment;
    return this.prisma.material.update({ where: { id }, data });
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    return this.prisma.material.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }
}
