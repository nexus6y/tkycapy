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
exports.MaterialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MaterialService = class MaterialService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTenantId() {
        return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
    }
    async findAll(query) {
        const { code, name, categoryId, status, specification, page = 1, pageSize = 20 } = query;
        const tenantId = await this.getTenantId();
        const where = { tenantId };
        if (code)
            where.code = { contains: code };
        if (name)
            where.name = { contains: name };
        if (categoryId)
            where.categoryId = categoryId;
        if (status)
            where.status = status;
        if (specification)
            where.specification = { contains: specification };
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
    async findOne(id) {
        const item = await this.prisma.material.findUnique({
            where: { id },
            include: { category: { select: { code: true, name: true } }, unit: { select: { code: true, name: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException('物料不存在');
        return item;
    }
    async create(dto) {
        const tenantId = await this.getTenantId();
        const existing = await this.prisma.material.findUnique({ where: { tenantId_code: { tenantId, code: dto.code } } });
        if (existing)
            throw new common_1.ConflictException('物料编码已存在');
        return this.prisma.material.create({
            data: { ...dto, tenantId },
            include: { category: { select: { code: true, name: true } }, unit: { select: { code: true, name: true } } },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.material.update({
            where: { id }, data: dto,
            include: { category: { select: { code: true, name: true } }, unit: { select: { code: true, name: true } } },
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.material.delete({ where: { id } });
        return { message: '删除成功' };
    }
};
exports.MaterialService = MaterialService;
exports.MaterialService = MaterialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaterialService);
//# sourceMappingURL=material.service.js.map