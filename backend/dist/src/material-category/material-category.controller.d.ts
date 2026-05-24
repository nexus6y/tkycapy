import { MaterialCategoryService } from './material-category.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from './dto/material-category.dto';
export declare class MaterialCategoryController {
    private readonly service;
    constructor(service: MaterialCategoryService);
    findAll(query: QueryCategoryDto): Promise<{
        items: {
            parentCode: string;
            parentName: string;
            parent: undefined;
            id: string;
            code: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            sortOrder: number;
            parentId: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        sortOrder: number;
        parentId: string | null;
    }>;
    create(dto: CreateCategoryDto): Promise<{
        parent: {
            code: string;
            name: string;
        } | null;
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
        parentId: string | null;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        parent: {
            code: string;
            name: string;
        } | null;
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
        parentId: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
