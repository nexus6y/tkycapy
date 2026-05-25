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
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import("@prisma/client").$Enums.CommonStatus;
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
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.CommonStatus;
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
        tenantId: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.CommonStatus;
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
        tenantId: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.CommonStatus;
        sortOrder: number;
        parentId: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
