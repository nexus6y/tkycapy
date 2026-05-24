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
            code: string;
            name: string;
            parentId: string | null;
            sortOrder: number;
            status: import("@prisma/client").$Enums.CommonStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        code: string;
        name: string;
        parentId: string | null;
        sortOrder: number;
        status: import("@prisma/client").$Enums.CommonStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
    }>;
    create(dto: CreateCategoryDto): Promise<{
        parent: {
            code: string;
            name: string;
        } | null;
    } & {
        code: string;
        name: string;
        parentId: string | null;
        sortOrder: number;
        status: import("@prisma/client").$Enums.CommonStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        parent: {
            code: string;
            name: string;
        } | null;
    } & {
        code: string;
        name: string;
        parentId: string | null;
        sortOrder: number;
        status: import("@prisma/client").$Enums.CommonStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
