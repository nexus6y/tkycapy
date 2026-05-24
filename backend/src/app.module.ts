import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MaterialCategoryModule } from './material-category/material-category.module';

@Module({
  imports: [PrismaModule, AuthModule, MaterialCategoryModule],
})
export class AppModule {}
