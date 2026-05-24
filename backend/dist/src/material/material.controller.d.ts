import { MaterialService } from './material.service';
import { CreateMaterialDto, UpdateMaterialDto, QueryMaterialDto } from './dto/material.dto';
export declare class MaterialController {
    private readonly service;
    constructor(service: MaterialService);
    findAll(query: QueryMaterialDto): Promise<{
        items: {
            categoryCode: string;
            categoryName: string;
            unitCode: string;
            unitName: string;
            unitSymbol: string | null;
            category: undefined;
            unit: undefined;
            id: string;
            code: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            sortOrder: number;
            categoryId: string;
            unitId: string;
            specification: string | null;
            externalCode: string | null;
            materialType: import("@prisma/client").$Enums.MaterialType;
            materialProperty: string | null;
            productCategory: string | null;
            remark: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        category: {
            code: string;
            name: string;
        };
        unit: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        sortOrder: number;
        categoryId: string;
        unitId: string;
        specification: string | null;
        externalCode: string | null;
        materialType: import("@prisma/client").$Enums.MaterialType;
        materialProperty: string | null;
        productCategory: string | null;
        remark: string | null;
    }>;
    create(dto: CreateMaterialDto): Promise<{
        category: {
            code: string;
            name: string;
        };
        unit: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        sortOrder: number;
        categoryId: string;
        unitId: string;
        specification: string | null;
        externalCode: string | null;
        materialType: import("@prisma/client").$Enums.MaterialType;
        materialProperty: string | null;
        productCategory: string | null;
        remark: string | null;
    }>;
    update(id: string, dto: UpdateMaterialDto): Promise<{
        category: {
            code: string;
            name: string;
        };
        unit: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        sortOrder: number;
        categoryId: string;
        unitId: string;
        specification: string | null;
        externalCode: string | null;
        materialType: import("@prisma/client").$Enums.MaterialType;
        materialProperty: string | null;
        productCategory: string | null;
        remark: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
