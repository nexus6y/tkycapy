import { Module } from "@nestjs/common";
import { IssueOrderController } from "./issue-order.controller";
import { ReturnOrderController } from "./return-order.controller";
import { PurchasePlanController } from "./purchase-plan.controller";
import { AdjustOrderController } from "./adjust-order.controller";
import { CompleteReportController } from "./complete-report.controller";

@Module({
  controllers: [IssueOrderController, ReturnOrderController, PurchasePlanController, AdjustOrderController, CompleteReportController],
})
export class NewEntitiesModule {}
