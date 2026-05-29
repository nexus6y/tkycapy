import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './purchase-order.controller';

@Module({ controllers: [PurchaseOrderController] })
export class PurchaseOrderModule {}
