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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QuotationController = class QuotationController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTenantId() {
        return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
    }
    async findAll(status, code, name, page = 1, pageSize = 30) {
        const tenantId = await this.getTenantId();
        const where = { tenantId };
        if (status)
            where.approvalStatus = status;
        if (code)
            where.quotationNo = { contains: code };
        if (name)
            where.quotationName = { contains: name };
        const [items, total] = await Promise.all([
            this.prisma.quotation.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
            this.prisma.quotation.count({ where }),
        ]);
        return { items, total, page: +page, pageSize: +pageSize };
    }
    async create(dto) {
        const tenantId = await this.getTenantId();
        return this.prisma.quotation.create({ data: { ...dto, tenantId } });
    }
    async update(id, dto) {
        return this.prisma.quotation.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.prisma.quotation.delete({ where: { id } });
        return { message: '删除成功' };
    }
    async submit(id) {
        return this.prisma.quotation.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } });
    }
};
exports.QuotationController = QuotationController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('name')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "submit", null);
exports.QuotationController = QuotationController = __decorate([
    (0, common_1.Controller)('quotations'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotationController);
//# sourceMappingURL=quotation.controller.js.map