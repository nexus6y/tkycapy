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
exports.MeasurementUnitController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MeasurementUnitController = class MeasurementUnitController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTenantId() {
        return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
    }
    async findAll(page = 1, pageSize = 200) {
        const [items, total] = await Promise.all([
            this.prisma.measurementUnit.findMany({ orderBy: { sortOrder: 'asc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
            this.prisma.measurementUnit.count(),
        ]);
        return { items, total, page: +page, pageSize: +pageSize };
    }
    async create(dto) {
        const tenantId = await this.getTenantId();
        return this.prisma.measurementUnit.create({ data: { ...dto, tenantId } });
    }
};
exports.MeasurementUnitController = MeasurementUnitController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MeasurementUnitController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeasurementUnitController.prototype, "create", null);
exports.MeasurementUnitController = MeasurementUnitController = __decorate([
    (0, common_1.Controller)('measurement-units'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeasurementUnitController);
//# sourceMappingURL=measurement-unit.controller.js.map