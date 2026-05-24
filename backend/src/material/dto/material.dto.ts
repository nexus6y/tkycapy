import { IsString, IsOptional, IsInt, IsIn, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsOptional() @IsBoolean() unifiedUnit?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
  @IsOptional() @IsString() remark?: string;
  // 采购
  @IsOptional() @IsString() defaultSupplier?: string;
  @IsOptional() @IsString() defaultPurchaser?: string;
  @IsOptional() @IsNumber() minPurchaseQty?: number;
  @IsOptional() @IsNumber() plannedPrice?: number;
  @IsOptional() @IsString() requiredManufacturer?: string;
  @IsOptional() @IsString() excludedManufacturer?: string;
  @IsOptional() @IsString() responsiblePerson?: string;
  // 质检
  @IsOptional() @IsBoolean() needInspection?: boolean;
  @IsOptional() @IsNumber() defectRateLimit?: number;
  // 销售
  @IsOptional() @IsString() defaultSalesperson?: string;
  @IsOptional() @IsNumber() minOrderQty?: number;
  // 仓储
  @IsOptional() @IsString() defaultWarehouseId?: string;
  @IsOptional() @IsNumber() safetyStockQty?: number;
  @IsOptional() @IsNumber() maxStockQty?: number;
  @IsOptional() @IsNumber() minStockQty?: number;
  @IsOptional() @IsBoolean() batchManaged?: boolean;
  @IsOptional() @IsBoolean() shelfLifeManaged?: boolean;
  @IsOptional() @IsInt() remainingShelfLife?: number;
  @IsOptional() @IsBoolean() serialManaged?: boolean;
  // 生产
  @IsOptional() @IsBoolean() directProduction?: boolean;
  @IsOptional() @IsString() planAttribute?: string;
  @IsOptional() @IsNumber() economicBatch?: number;
  @IsOptional() @IsNumber() batchMultiple?: number;
  @IsOptional() @IsNumber() lossRate?: number;
  @IsOptional() @IsString() defaultDeptId?: string;
  @IsOptional() @IsString() issueMethod?: string;
  // 工时
  @IsOptional() @IsNumber() prodStdQty?: number;
  @IsOptional() @IsNumber() prodStdHours?: number;
  @IsOptional() @IsNumber() repairStdQty?: number;
  @IsOptional() @IsNumber() repairStdHours?: number;
  @IsOptional() @IsNumber() maintStdQty?: number;
  @IsOptional() @IsNumber() maintStdHours?: number;
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
  @IsOptional() @IsBoolean() unifiedUnit?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @IsString() defaultSupplier?: string;
  @IsOptional() @IsString() defaultPurchaser?: string;
  @IsOptional() @IsNumber() minPurchaseQty?: number;
  @IsOptional() @IsNumber() plannedPrice?: number;
  @IsOptional() @IsString() requiredManufacturer?: string;
  @IsOptional() @IsString() excludedManufacturer?: string;
  @IsOptional() @IsString() responsiblePerson?: string;
  @IsOptional() @IsBoolean() needInspection?: boolean;
  @IsOptional() @IsNumber() defectRateLimit?: number;
  @IsOptional() @IsString() defaultSalesperson?: string;
  @IsOptional() @IsNumber() minOrderQty?: number;
  @IsOptional() @IsString() defaultWarehouseId?: string;
  @IsOptional() @IsNumber() safetyStockQty?: number;
  @IsOptional() @IsNumber() maxStockQty?: number;
  @IsOptional() @IsNumber() minStockQty?: number;
  @IsOptional() @IsBoolean() batchManaged?: boolean;
  @IsOptional() @IsBoolean() shelfLifeManaged?: boolean;
  @IsOptional() @IsInt() remainingShelfLife?: number;
  @IsOptional() @IsBoolean() serialManaged?: boolean;
  @IsOptional() @IsBoolean() directProduction?: boolean;
  @IsOptional() @IsString() planAttribute?: string;
  @IsOptional() @IsNumber() economicBatch?: number;
  @IsOptional() @IsNumber() batchMultiple?: number;
  @IsOptional() @IsNumber() lossRate?: number;
  @IsOptional() @IsString() defaultDeptId?: string;
  @IsOptional() @IsString() issueMethod?: string;
  @IsOptional() @IsNumber() prodStdQty?: number;
  @IsOptional() @IsNumber() prodStdHours?: number;
  @IsOptional() @IsNumber() repairStdQty?: number;
  @IsOptional() @IsNumber() repairStdHours?: number;
  @IsOptional() @IsNumber() maintStdQty?: number;
  @IsOptional() @IsNumber() maintStdHours?: number;
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
