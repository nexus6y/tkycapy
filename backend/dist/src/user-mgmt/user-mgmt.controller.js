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
exports.UserMgmtController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserMgmtController = class UserMgmtController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(username, name, status, page = 1, pageSize = 30) {
        const where = {};
        if (username)
            where.username = { contains: username };
        if (name)
            where.name = { contains: name };
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([this.prisma.user.findMany({ where, select: { id: true, username: true, name: true, email: true, phone: true, status: true, lastLoginAt: true, createdAt: true }, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.user.count({ where })]);
        return { items, total, page: +page, pageSize: +pageSize };
    }
    async remove(id) { await this.prisma.user.delete({ where: { id } }); return { message: '删除成功' }; }
};
exports.UserMgmtController = UserMgmtController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('username')),
    __param(1, (0, common_1.Query)('name')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], UserMgmtController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserMgmtController.prototype, "remove", null);
exports.UserMgmtController = UserMgmtController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserMgmtController);
//# sourceMappingURL=user-mgmt.controller.js.map