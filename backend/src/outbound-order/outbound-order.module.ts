import { Module } from '@nestjs/common'; import { OutboundOrderController } from './outbound-order.controller'; @Module({ controllers: [OutboundOrderController] }) export class OutboundOrderModule {}
