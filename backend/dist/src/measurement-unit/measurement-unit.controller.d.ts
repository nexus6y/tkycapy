import { PrismaService } from '../prisma/prisma.service';
export declare class MeasurementUnitController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            symbol: string | null;
            id: string;
            code: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            sortOrder: number;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: {
        code: string;
        name: string;
        symbol?: string;
        sortOrder?: number;
    }): Promise<{
        symbol: string | null;
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        sortOrder: number;
    }>;
}
