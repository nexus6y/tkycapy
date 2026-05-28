import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const ToInt = () => {
  const tf = Transform(({ value }) => value === '' ? undefined : value);
  const td = Type(() => Number);
  return function (target: any, key: string) { tf(target, key); td(target, key); };
};

export class CreateCategoryDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @ToInt() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @ToInt() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
}

export class QueryCategoryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() pageSize?: number;
}
