import { Module } from '@nestjs/common';
import { MaterialApprovalController } from './material-approval.controller';
@Module({ controllers: [MaterialApprovalController] })
export class MaterialApprovalModule {}
