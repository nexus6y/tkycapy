import { Module } from '@nestjs/common';
import { MaterialCategoryController } from './material-category.controller';
import { MaterialCategoryService } from './material-category.service';

@Module({
  controllers: [MaterialCategoryController],
  providers: [MaterialCategoryService],
})
export class MaterialCategoryModule {}
