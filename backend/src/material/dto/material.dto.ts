import { IsString, IsOptional, IsInt, IsIn, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Helper: convert empty string to undefined (so @IsOptional skips validation)
const ToNumber = () => {
  const transformer = Transform(({ value }) => value === '' ? undefined : value);
  const typeDeco = Type(() => Number);
  return function (target: any, key: string) {
    transformer(target, key);
    typeDeco(target, key);
  };
};

// Helper: convert empty string to undefined for boolean fields
const ToBoolean = () => {
  return Transform(({ value }) => value === '' ? undefined : value);
};

export class CreateMaterialDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() categoryId: string;
  @IsString() unitId: string;
  @IsOptional() @IsString() specification?: string;
  @IsOptional() @IsString() externalCode?: string;
  @IsOptional() @IsIn(['PHYSICAL', 'VIRTUAL']) materialType?: string;
  @IsOptional() @IsString() materialProperty?: string;
  @IsOptional() @IsString() productCategory?: string;
  @IsOptional() @ToBoolean() @IsBoolean() unifiedUnit?: boolean;
  @IsOptional() @ToNumber() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
  @IsOptional() @IsString() remark?: string;
  // 采购
  @IsOptional() @IsString() defaultSupplier?: string;
  @IsOptional() @IsString() defaultPurchaser?: string;
  @IsOptional() @ToNumber() @IsNumber() minPurchaseQty?: number;
  @IsOptional() @ToNumber() @IsNumber() plannedPrice?: number;
  @IsOptional() @IsString() requiredManufacturer?: string;
  @IsOptional() @IsString() excludedManufacturer?: string;
  @IsOptional() @IsString() responsiblePerson?: string;
  // 质检
  @IsOptional() @ToBoolean() @IsBoolean() needInspection?: boolean;
  @IsOptional() @ToNumber() @IsNumber() defectRateLimit?: number;
  // 销售
  @IsOptional() @IsString() defaultSalesperson?: string;
  @IsOptional() @ToNumber() @IsNumber() minOrderQty?: number;
  // 仓储
  @IsOptional() @IsString() defaultWarehouseId?: string;
  @IsOptional() @ToNumber() @IsNumber() safetyStockQty?: number;
  @IsOptional() @ToNumber() @IsNumber() maxStockQty?: number;
  @IsOptional() @ToNumber() @IsNumber() minStockQty?: number;
  @IsOptional() @ToBoolean() @IsBoolean() batchManaged?: boolean;
  @IsOptional() @ToBoolean() @IsBoolean() shelfLifeManaged?: boolean;
  @IsOptional() @ToNumber() @IsInt() remainingShelfLife?: number;
  @IsOptional() @ToBoolean() @IsBoolean() serialManaged?: boolean;
  // 生产
  @IsOptional() @ToBoolean() @IsBoolean() directProduction?: boolean;
  @IsOptional() @IsString() planAttribute?: string;
  @IsOptional() @ToNumber() @IsNumber() economicBatch?: number;
  @IsOptional() @ToNumber() @IsNumber() batchMultiple?: number;
  @IsOptional() @ToNumber() @IsNumber() lossRate?: number;
  @IsOptional() @IsString() defaultDeptId?: string;
  @IsOptional() @IsString() issueMethod?: string;
  // 工时
  @IsOptional() @ToNumber() @IsNumber() prodStdQty?: number;
  @IsOptional() @ToNumber() @IsNumber() prodStdHours?: number;
  @IsOptional() @ToNumber() @IsNumber() repairStdQty?: number;
  @IsOptional() @ToNumber() @IsNumber() repairStdHours?: number;
  @IsOptional() @ToNumber() @IsNumber() maintStdQty?: number;
  @IsOptional() @ToNumber() @IsNumber() maintStdHours?: number;
}

export class UpdateMaterialDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() specification?: string;
  @IsOptional() @IsString() externalCode?: string;
  @IsOptional() @IsIn(['PHYSICAL', 'VIRTUAL']) materialType?: string;
  @IsOptional() @IsString() materialProperty?: string;
  @IsOptional() @IsString() productCategory?: string;
  @IsOptional() @ToBoolean() @IsBoolean() unifiedUnit?: boolean;
  @IsOptional() @ToNumber() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @IsString() defaultSupplier?: string;
  @IsOptional() @IsString() defaultPurchaser?: string;
  @IsOptional() @ToNumber() @IsNumber() minPurchaseQty?: number;
  @IsOptional() @ToNumber() @IsNumber() plannedPrice?: number;
  @IsOptional() @IsString() requiredManufacturer?: string;
  @IsOptional() @IsString() excludedManufacturer?: string;
  @IsOptional() @IsString() responsiblePerson?: string;
  @IsOptional() @ToBoolean() @IsBoolean() needInspection?: boolean;
  @IsOptional() @ToNumber() @IsNumber() defectRateLimit?: number;
  @IsOptional() @IsString() defaultSalesperson?: string;
  @IsOptional() @ToNumber() @IsNumber() minOrderQty?: number;
  @IsOptional() @IsString() defaultWarehouseId?: string;
  @IsOptional() @ToNumber() @IsNumber() safetyStockQty?: number;
  @IsOptional() @ToNumber() @IsNumber() maxStockQty?: number;
  @IsOptional() @ToNumber() @IsNumber() minStockQty?: number;
  @IsOptional() @ToBoolean() @IsBoolean() batchManaged?: boolean;
  @IsOptional() @ToBoolean() @IsBoolean() shelfLifeManaged?: boolean;
  @IsOptional() @ToNumber() @IsInt() remainingShelfLife?: number;
  @IsOptional() @ToBoolean() @IsBoolean() serialManaged?: boolean;
  @IsOptional() @ToBoolean() @IsBoolean() directProduction?: boolean;
  @IsOptional() @IsString() planAttribute?: string;
  @IsOptional() @ToNumber() @IsNumber() economicBatch?: number;
  @IsOptional() @ToNumber() @IsNumber() batchMultiple?: number;
  @IsOptional() @ToNumber() @IsNumber() lossRate?: number;
  @IsOptional() @IsString() defaultDeptId?: string;
  @IsOptional() @IsString() issueMethod?: string;
  @IsOptional() @ToNumber() @IsNumber() prodStdQty?: number;
  @IsOptional() @ToNumber() @IsNumber() prodStdHours?: number;
  @IsOptional() @ToNumber() @IsNumber() repairStdQty?: number;
  @IsOptional() @ToNumber() @IsNumber() repairStdHours?: number;
  @IsOptional() @ToNumber() @IsNumber() maintStdQty?: number;
  @IsOptional() @ToNumber() @IsNumber() maintStdHours?: number;
}

export class QueryMaterialDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() externalCode?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() specification?: string;
  @IsOptional() @IsString() materialProperty?: string;
  @IsOptional() @IsString() productCategory?: string;
  @IsOptional() @IsString() planAttribute?: string;
  @IsOptional() @IsString() defaultSupplierName?: string;
  @IsOptional() @IsString() responsiblePerson?: string;
  @IsOptional() @IsString() approvalStatus?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() pageSize?: number;
}
