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
exports.PermissionMgmtController = exports.MenuMgmtController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MenuMgmtController = class MenuMgmtController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() { return this.prisma.menu.findMany({ orderBy: { sortOrder: 'asc' } }); }
    async create(dto) { return this.prisma.menu.create({ data: dto }); }
    async update(id, dto) { return this.prisma.menu.update({ where: { id }, data: dto }); }
    async remove(id) { await this.prisma.menu.delete({ where: { id } }); return { message: '删除成功' }; }
};
exports.MenuMgmtController = MenuMgmtController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MenuMgmtController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MenuMgmtController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MenuMgmtController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuMgmtController.prototype, "remove", null);
exports.MenuMgmtController = MenuMgmtController = __decorate([
    (0, common_1.Controller)('menus-mgmt'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuMgmtController);
let PermissionMgmtController = class PermissionMgmtController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() { return this.prisma.permission.findMany({ include: { role: { select: { name: true } } } }); }
    async create(dto) { return this.prisma.permission.create({ data: dto }); }
    async remove(id) { await this.prisma.permission.delete({ where: { id } }); return { message: '删除成功' }; }
};
exports.PermissionMgmtController = PermissionMgmtController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionMgmtController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionMgmtController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionMgmtController.prototype, "remove", null);
exports.PermissionMgmtController = PermissionMgmtController = __decorate([
    (0, common_1.Controller)('permissions-mgmt'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionMgmtController);
//# sourceMappingURL=menu.controller.js.map