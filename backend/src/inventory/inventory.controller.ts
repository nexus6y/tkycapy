import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('inventory')
export class InventoryController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(
    @Query('materialCode') materialCode?: string,
    @Query('materialName') materialName?: string,
    @Query('warehouseCode') warehouseCode?: string,
    @Query('locationCode') locationCode?: string,
    @Query('batchNo') batchNo?: string,
    @Query('qualityStatus') qualityStatus?: string,
    @Query('projectCode') projectCode?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 30,
  ) {
    const tenantId = await this.tid();
    const where: any = { tenantId };
    if (materialCode) where.materialCode = { contains: materialCode };
    if (materialName) where.materialName = { contains: materialName };
    if (warehouseCode) where.warehouseCode = { contains: warehouseCode };
    if (locationCode) where.locationCode = { contains: locationCode };
    if (batchNo) where.batchNo = { contains: batchNo };
    if (qualityStatus) where.qualityStatus = qualityStatus;
    if (projectCode) where.projectCode = { contains: projectCode };

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
      this.prisma.inventory.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get('transactions')
  async transactions(
    @Query('materialCode') materialCode?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 30,
  ) {
    const tenantId = await this.tid();
    const where: any = { tenantId };
    if (materialCode) where.materialCode = { contains: materialCode };
    if (type) where.transactionType = type;
    const [items, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
}
