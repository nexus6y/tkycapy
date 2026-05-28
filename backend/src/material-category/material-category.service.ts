import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from './dto/material-category.dto';

@Injectable()
export class MaterialCategoryService {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } });
    return tenant.id;
  }

  async findAll(query: QueryCategoryDto) {
    const { status, code, name, startDate, endDate, page = 1, pageSize = 20 } = query;
    const tenantId = await this.getTenantId();
    const where: any = { tenantId };

    if (status) where.status = status;
    if (code) where.code = { contains: code };
    if (name) where.name = { contains: name };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [items, total] = await Promise.all([
      this.prisma.materialCategory.findMany({
        where,
        include: { parent: { select: { code: true, name: true } } },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.materialCategory.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        parentCode: item.parent?.code ?? '',
        parentName: item.parent?.name ?? '',
        parent: undefined,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.materialCategory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('分类不存在');
    return item;
  }

  async create(dto: CreateCategoryDto) {
    const tenantId = await this.getTenantId();
    const existing = await this.prisma.materialCategory.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException('分类编码已存在');

    if (dto.parentId) {
      const parent = await this.prisma.materialCategory.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new BadRequestException('上级分类不存在');
    }

    return this.prisma.materialCategory.create({
      data: { ...dto, tenantId } as any,
      include: { parent: { select: { code: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.materialCategory.update({
      where: { id },
      data: dto as any,
      include: { parent: { select: { code: true, name: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const children = await this.prisma.materialCategory.count({ where: { parentId: id } });
    if (children > 0) throw new BadRequestException('存在下级分类，无法删除');
    await this.prisma.materialCategory.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
