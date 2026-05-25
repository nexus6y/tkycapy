import { PrismaService } from '../prisma/prisma.service';
export declare class CostLedgerController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(type?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            tenantId: string;
            remark: string | null;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            materialName: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal | null;
            unitPrice: import("@prisma/client/runtime/client").Decimal | null;
            transactionNo: string;
            transactionType: string;
            transactionDate: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        remark: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        unitPrice: import("@prisma/client/runtime/client").Decimal | null;
        transactionNo: string;
        transactionType: string;
        transactionDate: Date;
    }>;
}
