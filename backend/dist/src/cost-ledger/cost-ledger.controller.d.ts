import { PrismaService } from '../prisma/prisma.service';
export declare class CostLedgerController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(type?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            transactionNo: string;
            transactionType: string;
            materialName: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal | null;
            unitPrice: import("@prisma/client/runtime/client").Decimal | null;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            transactionDate: Date;
            remark: string | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
