import { Module } from '@nestjs/common'; import { LendOrderController } from './lend-order.controller'; @Module({ controllers: [LendOrderController] }) export class LendOrderModule {}
