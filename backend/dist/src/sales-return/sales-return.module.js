"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesReturnModule = void 0;
const common_1 = require("@nestjs/common");
const sales_return_controller_1 = require("./sales-return.controller");
let SalesReturnModule = class SalesReturnModule {
};
exports.SalesReturnModule = SalesReturnModule;
exports.SalesReturnModule = SalesReturnModule = __decorate([
    (0, common_1.Module)({ controllers: [sales_return_controller_1.SalesReturnController] })
], SalesReturnModule);
//# sourceMappingURL=sales-return.module.js.map