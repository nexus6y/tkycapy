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
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            name: string;
            code: string;
            status: import("@prisma/client").$Enums.CommonStatus;
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
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        sortOrder: number;
    }>;
}
