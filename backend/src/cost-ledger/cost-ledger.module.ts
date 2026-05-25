import { Module } from '@nestjs/common'; import { CostLedgerController } from './cost-ledger.controller'; @Module({ controllers: [CostLedgerController] }) export class CostLedgerModule {}
