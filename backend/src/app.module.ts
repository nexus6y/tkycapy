import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MaterialCategoryModule } from './material-category/material-category.module';
import { MaterialModule } from './material/material.module';
import { MeasurementUnitModule } from './measurement-unit/measurement-unit.module';
import { MaterialParamModule } from './material-param/material-param.module';
import { MaterialApprovalModule } from './material-approval/material-approval.module';
import { ProjectModule } from './project/project.module';
import { ContractModule } from './contract/contract.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [PrismaModule, AuthModule, MaterialCategoryModule, MaterialModule, MeasurementUnitModule, MaterialParamModule, MaterialApprovalModule, ProjectModule, ContractModule, CustomerModule],
})
export class AppModule {}
