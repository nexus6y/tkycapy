"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const material_category_module_1 = require("./material-category/material-category.module");
const material_module_1 = require("./material/material.module");
const measurement_unit_module_1 = require("./measurement-unit/measurement-unit.module");
const material_param_module_1 = require("./material-param/material-param.module");
const material_approval_module_1 = require("./material-approval/material-approval.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, material_category_module_1.MaterialCategoryModule, material_module_1.MaterialModule, measurement_unit_module_1.MeasurementUnitModule, material_param_module_1.MaterialParamModule, material_approval_module_1.MaterialApprovalModule],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map