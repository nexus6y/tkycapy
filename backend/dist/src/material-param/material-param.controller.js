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
exports.MaterialParamController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MaterialParamController = class MaterialParamController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTenantId() {
        return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
    }
    async get() {
        const tenantId = await this.getTenantId();
        let param = await this.prisma.materialParam.findUnique({ where: { tenantId } });
        if (!param) {
            param = await this.prisma.materialParam.create({
                data: { tenantId, codeFormat: 'MAT{yyyyMM}{seq:4}', allowDuplicateName: false, autoApproval: false, defaultStatus: 'ACTIVE' },
            });
        }
        return param;
    }
    async update(dto) {
        const tenantId = await this.getTenantId();
        const data = { ...dto, defaultStatus: dto.defaultStatus };
        return this.prisma.materialParam.upsert({
            where: { tenantId },
            create: { tenantId, ...data },
            update: data,
        });
    }
};
exports.MaterialParamController = MaterialParamController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MaterialParamController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaterialParamController.prototype, "update", null);
exports.MaterialParamController = MaterialParamController = __decorate([
    (0, common_1.Controller)('material-params'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaterialParamController);
//# sourceMappingURL=material-param.controller.js.map