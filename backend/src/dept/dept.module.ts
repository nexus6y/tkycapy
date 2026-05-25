import { Module } from '@nestjs/common'; import { DeptController } from './dept.controller'; @Module({ controllers: [DeptController] }) export class DeptModule {}
