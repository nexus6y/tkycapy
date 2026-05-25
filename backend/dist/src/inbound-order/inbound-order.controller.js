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
exports.InboundOrderController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InboundOrderController = class InboundOrderController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
    async findAll(status, code, page = 1, pageSize = 30) {
        const tenantId = await this.tid();
        const where = { tenantId };
        if (status)
            where.approvalStatus = status;
        if (code)
            where.orderNo = { contains: code };
        const [items, total] = await Promise.all([this.prisma.inboundOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.inboundOrder.count({ where })]);
        return { items, total, page: +page, pageSize: +pageSize };
        findOne(, id, string);
        {
            return this.prisma.inboundOrder.findUniqueOrThrow({ where: { id } });
        }
    }
    async create(dto) { const tenantId = await this.tid(); return this.prisma.inboundOrder.create({ data: { ...dto, tenantId } }); }
    async update(id, dto) { return this.prisma.inboundOrder.update({ where: { id }, data: dto }); }
    async remove(id) { await this.prisma.inboundOrder.delete({ where: { id } }); return { message: '删除成功' }; }
};
exports.InboundOrderController = InboundOrderController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], InboundOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InboundOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InboundOrderController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InboundOrderController.prototype, "remove", null);
exports.InboundOrderController = InboundOrderController = __decorate([
    (0, common_1.Controller)('inbound-orders'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InboundOrderController);
//# sourceMappingURL=inbound-order.controller.js.map