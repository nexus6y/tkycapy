export declare class CreateCategoryDto {
    code: string;
    name: string;
    parentId?: string;
    sortOrder?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}
export declare class UpdateCategoryDto {
    name?: string;
    parentId?: string;
    sortOrder?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}
export declare class QueryCategoryDto {
    status?: string;
    code?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}
