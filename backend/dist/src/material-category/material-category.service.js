"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialCategoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MaterialCategoryService = class MaterialCategoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTenantId() {
        const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } });
        return tenant.id;
    }
    async findAll(query) {
        const { status, code, name, startDate, endDate, page = 1, pageSize = 20 } = query;
        const tenantId = await this.getTenantId();
        const where = { tenantId };
        if (status)
            where.status = status;
        if (code)
            where.code = { contains: code };
        if (name)
            where.name = { contains: name };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
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
    async findOne(id) {
        const item = await this.prisma.materialCategory.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('分类不存在');
        return item;
    }
    async create(dto) {
        const tenantId = await this.getTenantId();
        const existing = await this.prisma.materialCategory.findUnique({
            where: { tenantId_code: { tenantId, code: dto.code } },
        });
        if (existing)
            throw new common_1.ConflictException('分类编码已存在');
        if (dto.parentId) {
            const parent = await this.prisma.materialCategory.findUnique({ where: { id: dto.parentId } });
            if (!parent)
                throw new common_1.BadRequestException('上级分类不存在');
        }
        return this.prisma.materialCategory.create({
            data: { ...dto, tenantId },
            include: { parent: { select: { code: true, name: true } } },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.materialCategory.update({
            where: { id },
            data: dto,
            include: { parent: { select: { code: true, name: true } } },
        });
    }
    async remove(id) {
        await this.findOne(id);
        const children = await this.prisma.materialCategory.count({ where: { parentId: id } });
        if (children > 0)
            throw new common_1.BadRequestException('存在下级分类，无法删除');
        await this.prisma.materialCategory.delete({ where: { id } });
        return { message: '删除成功' };
    }
};
exports.MaterialCategoryService = MaterialCategoryService;
exports.MaterialCategoryService = MaterialCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaterialCategoryService);
//# sourceMappingURL=material-category.service.js.map