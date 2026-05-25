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
            sortOrder: number;
            address: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
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
        sortOrder: number;
        address: string | null;
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
        sortOrder: number;
        address: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
