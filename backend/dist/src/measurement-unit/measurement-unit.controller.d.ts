import { PrismaService } from '../prisma/prisma.service';
export declare class MeasurementUnitController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            symbol: string | null;
            id: string;
            tenantId: string;
            code: string;
            name: string;
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
    create(dto: {
        code: string;
        name: string;
        symbol?: string;
        sortOrder?: number;
    }): Promise<{
        symbol: string | null;
        id: string;
        tenantId: string;
        code: string;
        name: string;
        sortOrder: number;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
