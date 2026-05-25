import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(code?: string, name?: string, warehouseId?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            materialName: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal;
            warehouseId: string | null;
            warehouseName: string | null;
            createdAt: Date;
            updatedAt: Date;
            materialId: string | null;
            locationCode: string | null;
            batchNo: string | null;
            availableQty: import("@prisma/client/runtime/client").Decimal;
            lockedQty: import("@prisma/client/runtime/client").Decimal;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
