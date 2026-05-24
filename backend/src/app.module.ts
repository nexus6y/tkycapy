import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MaterialCategoryModule } from './material-category/material-category.module';
import { MaterialModule } from './material/material.module';
import { MeasurementUnitModule } from './measurement-unit/measurement-unit.module';

@Module({
  imports: [PrismaModule, AuthModule, MaterialCategoryModule, MaterialModule, MeasurementUnitModule],
})
export class AppModule {}
