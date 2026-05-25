import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from './dto/material-category.dto';
export declare class MaterialCategoryService {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(query: QueryCategoryDto): Promise<{
        items: {
            parentCode: string;
            parentName: string;
            parent: undefined;
            id: string;
            tenantId: string;
            createdAt: Date;
            name: string;
            code: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            updatedAt: Date;
            deletedAt: Date | null;
            sortOrder: number;
            parentId: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        name: string;
        code: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        updatedAt: Date;
        deletedAt: Date | null;
        sortOrder: number;
        parentId: string | null;
    }>;
    create(dto: CreateCategoryDto): Promise<{
        parent: {
            name: string;
            code: string;
        } | null;
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        name: string;
        code: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        updatedAt: Date;
        deletedAt: Date | null;
        sortOrder: number;
        parentId: string | null;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        parent: {
            name: string;
            code: string;
        } | null;
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        name: string;
        code: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        updatedAt: Date;
        deletedAt: Date | null;
        sortOrder: number;
        parentId: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
