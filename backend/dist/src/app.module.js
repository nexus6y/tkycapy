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
const project_module_1 = require("./project/project.module");
const contract_module_1 = require("./contract/contract.module");
const transfer_order_module_1 = require("./transfer-order/transfer-order.module");
const dept_module_1 = require("./dept/dept.module");
const dict_mgmt_module_1 = require("./dict-mgmt/dict-mgmt.module");
const lend_order_module_1 = require("./lend-order/lend-order.module");
const scrap_order_module_1 = require("./scrap-order/scrap-order.module");
const user_mgmt_module_1 = require("./user-mgmt/user-mgmt.module");
const inbound_order_module_1 = require("./inbound-order/inbound-order.module");
const outbound_order_module_1 = require("./outbound-order/outbound-order.module");
const cost_ledger_module_1 = require("./cost-ledger/cost-ledger.module");
const warehouse_module_1 = require("./warehouse/warehouse.module");
const inventory_module_1 = require("./inventory/inventory.module");
const bom_module_1 = require("./bom/bom.module");
const production_order_module_1 = require("./production-order/production-order.module");
const inspection_module_1 = require("./inspection/inspection.module");
const demand_plan_module_1 = require("./demand-plan/demand-plan.module");
const supplier_module_1 = require("./supplier/supplier.module");
const customer_module_1 = require("./customer/customer.module");
const quotation_module_1 = require("./quotation/quotation.module");
const pre_order_module_1 = require("./pre-order/pre-order.module");
const sales_order_module_1 = require("./sales-order/sales-order.module");
const sales_shipment_module_1 = require("./sales-shipment/sales-shipment.module");
const sales_return_module_1 = require("./sales-return/sales-return.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule, auth_module_1.AuthModule,
            material_category_module_1.MaterialCategoryModule, material_module_1.MaterialModule, measurement_unit_module_1.MeasurementUnitModule,
            material_param_module_1.MaterialParamModule, material_approval_module_1.MaterialApprovalModule,
            project_module_1.ProjectModule, contract_module_1.ContractModule,
            transfer_order_module_1.TransferOrderModule, dept_module_1.DeptModule, dict_mgmt_module_1.DictMgmtModule, lend_order_module_1.LendOrderModule, scrap_order_module_1.ScrapOrderModule, user_mgmt_module_1.UserMgmtModule, inbound_order_module_1.InboundOrderModule, outbound_order_module_1.OutboundOrderModule, cost_ledger_module_1.CostLedgerModule, warehouse_module_1.WarehouseModule, inventory_module_1.InventoryModule, bom_module_1.BomModule, production_order_module_1.ProductionOrderModule, inspection_module_1.InspectionModule, demand_plan_module_1.DemandPlanModule, supplier_module_1.SupplierModule, customer_module_1.CustomerModule, quotation_module_1.QuotationModule, pre_order_module_1.PreOrderModule,
            sales_order_module_1.SalesOrderModule, sales_shipment_module_1.SalesShipmentModule, sales_return_module_1.SalesReturnModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map