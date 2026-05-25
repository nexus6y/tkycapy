import { Module } from '@nestjs/common'; import { DictController } from './dict-mgmt.controller'; @Module({ controllers: [DictController] }) export class DictMgmtModule {}
