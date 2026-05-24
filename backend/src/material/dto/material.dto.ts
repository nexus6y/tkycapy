import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() categoryId: string;
  @IsString() unitId: string;
  @IsOptional() @IsString() specification?: string;
  @IsOptional() @IsString() externalCode?: string;
  @IsOptional() @IsIn(['PHYSICAL', 'VIRTUAL']) materialType?: 'PHYSICAL' | 'VIRTUAL';
  @IsOptional() @IsString() materialProperty?: string;
  @IsOptional() @IsString() productCategory?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: 'ACTIVE' | 'INACTIVE';
  @IsOptional() @IsString() remark?: string;
}

export class UpdateMaterialDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() specification?: string;
  @IsOptional() @IsString() externalCode?: string;
  @IsOptional() @IsIn(['PHYSICAL', 'VIRTUAL']) materialType?: 'PHYSICAL' | 'VIRTUAL';
  @IsOptional() @IsString() materialProperty?: string;
  @IsOptional() @IsString() productCategory?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: 'ACTIVE' | 'INACTIVE';
  @IsOptional() @IsString() remark?: string;
}

export class QueryMaterialDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() specification?: string;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() pageSize?: number;
}
