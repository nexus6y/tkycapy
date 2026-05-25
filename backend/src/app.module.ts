import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MaterialCategoryModule } from './material-category/material-category.module';
import { MaterialModule } from './material/material.module';
import { MeasurementUnitModule } from './measurement-unit/measurement-unit.module';
import { MaterialParamModule } from './material-param/material-param.module';
import { MaterialApprovalModule } from './material-approval/material-approval.module';
import { ProjectModule } from './project/project.module';
import { ContractModule } from './contract/contract.module';
import { UserMgmtModule } from "./user-mgmt/user-mgmt.module";
import { InboundOrderModule } from "./inbound-order/inbound-order.module";
import { OutboundOrderModule } from "./outbound-order/outbound-order.module";
import { CostLedgerModule } from "./cost-ledger/cost-ledger.module";
import { WarehouseModule } from "./warehouse/warehouse.module";
import { InventoryModule } from "./inventory/inventory.module";
import { BomModule } from "./bom/bom.module";
import { ProductionOrderModule } from "./production-order/production-order.module";
import { InspectionModule } from "./inspection/inspection.module";
import { DemandPlanModule } from './demand-plan/demand-plan.module';
import { SupplierModule } from "./supplier/supplier.module";
import { CustomerModule } from './customer/customer.module';
import { QuotationModule } from './quotation/quotation.module';
import { PreOrderModule } from './pre-order/pre-order.module';
import { SalesOrderModule } from './sales-order/sales-order.module';
import { SalesShipmentModule } from './sales-shipment/sales-shipment.module';
import { SalesReturnModule } from './sales-return/sales-return.module';

@Module({
  imports: [
    PrismaModule, AuthModule,
    MaterialCategoryModule, MaterialModule, MeasurementUnitModule,
    MaterialParamModule, MaterialApprovalModule,
    ProjectModule, ContractModule,
    UserMgmtModule, InboundOrderModule, OutboundOrderModule, CostLedgerModule, WarehouseModule, InventoryModule, BomModule, ProductionOrderModule, InspectionModule, DemandPlanModule, SupplierModule, CustomerModule, QuotationModule, PreOrderModule,
    SalesOrderModule, SalesShipmentModule, SalesReturnModule,
  ],
})
export class AppModule {}
