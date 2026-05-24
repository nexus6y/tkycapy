import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MaterialCategoryService } from './material-category.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from './dto/material-category.dto';

@Controller('material-categories')
export class MaterialCategoryController {
  constructor(private readonly service: MaterialCategoryService) {}

  @Get()
  findAll(@Query() query: QueryCategoryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
