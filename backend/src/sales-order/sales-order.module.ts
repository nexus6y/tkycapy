import { Module } from '@nestjs/common'; import { SalesOrderController } from './sales-order.controller'; @Module({ controllers: [SalesOrderController] }) export class SalesOrderModule {}
