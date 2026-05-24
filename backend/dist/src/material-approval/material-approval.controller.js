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
exports.MaterialApprovalController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MaterialApprovalController = class MaterialApprovalController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(status, code, page = 1, pageSize = 20) {
        const where = {};
        if (status)
            where.approvalStatus = status;
        if (code)
            where.code = { contains: code };
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
    async approve(id, comment) {
        const data = { approvalStatus: 'APPROVED' };
        if (comment)
            data.remark = comment;
        return this.prisma.material.update({ where: { id }, data });
    }
    async reject(id, comment) {
        const data = { approvalStatus: 'REJECTED' };
        if (comment)
            data.remark = comment;
        return this.prisma.material.update({ where: { id }, data });
    }
    async submit(id) {
        return this.prisma.material.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } });
    }
};
exports.MaterialApprovalController = MaterialApprovalController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MaterialApprovalController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MaterialApprovalController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MaterialApprovalController.prototype, "reject", null);
__decorate([
    (0, common_1.Put)(':id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialApprovalController.prototype, "submit", null);
exports.MaterialApprovalController = MaterialApprovalController = __decorate([
    (0, common_1.Controller)('material-approvals'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaterialApprovalController);
//# sourceMappingURL=material-approval.controller.js.map