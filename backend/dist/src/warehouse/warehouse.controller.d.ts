import { PrismaService } from '../prisma/prisma.service';
export declare class WarehouseController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            name: string;
            code: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            address: string | null;
            sortOrder: number;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        address: string | null;
        sortOrder: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        address: string | null;
        sortOrder: number;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        address: string | null;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
