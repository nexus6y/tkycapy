import { Module } from "@nestjs/common";
import { IssueOrderController } from "./issue-order.controller";
import { ReturnOrderController } from "./return-order.controller";
import { PurchasePlanController } from "./purchase-plan.controller";
import { AdjustOrderController } from "./adjust-order.controller";

@Module({
  controllers: [IssueOrderController, ReturnOrderController, PurchasePlanController, AdjustOrderController],
})
export class NewEntitiesModule {}
