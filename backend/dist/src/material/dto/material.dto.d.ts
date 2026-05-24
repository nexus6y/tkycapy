export declare class CreateMaterialDto {
    code: string;
    name: string;
    categoryId: string;
    unitId: string;
    specification?: string;
    externalCode?: string;
    materialType?: 'PHYSICAL' | 'VIRTUAL';
    materialProperty?: string;
    productCategory?: string;
    sortOrder?: number;
    status?: 'ACTIVE' | 'INACTIVE';
    remark?: string;
}
export declare class UpdateMaterialDto {
    name?: string;
    categoryId?: string;
    unitId?: string;
    specification?: string;
    externalCode?: string;
    materialType?: 'PHYSICAL' | 'VIRTUAL';
    materialProperty?: string;
    productCategory?: string;
    sortOrder?: number;
    status?: 'ACTIVE' | 'INACTIVE';
    remark?: string;
}
export declare class QueryMaterialDto {
    code?: string;
    name?: string;
    categoryId?: string;
    status?: string;
    specification?: string;
    page?: number;
    pageSize?: number;
}
