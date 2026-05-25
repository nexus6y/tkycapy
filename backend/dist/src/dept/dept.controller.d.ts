import { PrismaService } from '../prisma/prisma.service';
export declare class DeptController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
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
    create(dto: any): Promise<{
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
    update(id: string, dto: any): Promise<{
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
