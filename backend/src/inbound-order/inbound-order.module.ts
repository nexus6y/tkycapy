import { Module } from '@nestjs/common'; import { InboundOrderController } from './inbound-order.controller'; @Module({ controllers: [InboundOrderController] }) export class InboundOrderModule {}
