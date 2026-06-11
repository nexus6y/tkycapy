import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto, UpdateMaterialDto, QueryMaterialDto } from './dto/material.dto';

@Injectable()
export class MaterialService {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  async findAll(query: QueryMaterialDto) {
    const { code, name, externalCode, categoryId, status, specification, materialProperty, productCategory, planAttribute, defaultSupplierName, responsiblePerson, approvalStatus, startDate, endDate, page = 1, pageSize = 20 } = query;
    const tenantId = await this.getTenantId();
    const where: any = { tenantId };

    if (code) where.code = { contains: code };
    if (name) where.name = { contains: name };
    if (externalCode) where.externalCode = { contains: externalCode };
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (specification) where.specification = { contains: specification };
    if (materialProperty) where.materialProperty = { contains: materialProperty };
    if (productCategory) where.productCategory = { contains: productCategory };
    if (planAttribute) where.planAttribute = { contains: planAttribute };
    if (defaultSupplierName) where.defaultSupplier = { contains: defaultSupplierName };
    if (responsiblePerson) where.responsiblePerson = { contains: responsiblePerson };
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (startDate || endDate) {
      const createdAt: any = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        include: {
          category: { select: { code: true, name: true } },
          unit: { select: { code: true, name: true, symbol: true } },
        },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      items: items.map(i => ({
        ...i,
        categoryCode: i.category?.code, categoryName: i.category?.name,
        unitCode: i.unit?.code, unitName: i.unit?.name, unitSymbol: i.unit?.symbol,
        category: undefined, unit: undefined,
      })),
      total, page, pageSize,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.material.findUnique({
      where: { id },
      include: { category: { select: { code: true, name: true } }, unit: { select: { code: true, name: true } } },
    });
    if (!item) throw new NotFoundException('物料不存在');
    return item;
  }

  async create(dto: CreateMaterialDto) {
    const tenantId = await this.getTenantId();
    const existing = await this.prisma.material.findUnique({ where: { tenantId_code: { tenantId, code: dto.code } } });
    if (existing) throw new ConflictException('物料编码已存在');
    return this.prisma.material.create({
      data: { ...dto, tenantId } as any,
      include: { category: { select: { code: true, name: true } }, unit: { select: { code: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);
    return this.prisma.material.update({
      where: { id }, data: dto as any,
      include: { category: { select: { code: true, name: true } }, unit: { select: { code: true, name: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.material.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
