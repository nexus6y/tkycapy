import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('inventory')
export class InventoryController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('code') code?: string, @Query('name') name?: string, @Query('warehouseId') warehouseId?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (code) where.materialName = { contains: code };
    if (name) where.materialName = { contains: name };
    if (warehouseId) where.warehouseId = warehouseId;
    const [items, total] = await Promise.all([this.prisma.inventory.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.inventory.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
}
