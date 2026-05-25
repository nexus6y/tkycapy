import { PrismaService } from '../prisma/prisma.service';
export declare class WarehouseController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            code: string;
            name: string;
            address: string | null;
            sortOrder: number;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        code: string;
        name: string;
        address: string | null;
        sortOrder: number;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        code: string;
        name: string;
        address: string | null;
        sortOrder: number;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
