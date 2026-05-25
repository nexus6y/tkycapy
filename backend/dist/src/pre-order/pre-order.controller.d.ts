import { PrismaService } from '../prisma/prisma.service';
export declare class PreOrderController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            remark: string | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            customerName: string | null;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            orderNo: string;
            orderName: string;
            customerId: string | null;
            contractId: string | null;
            contractName: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        orderNo: string;
        orderName: string;
        customerId: string | null;
        contractId: string | null;
        contractName: string | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        orderNo: string;
        orderName: string;
        customerId: string | null;
        contractId: string | null;
        contractName: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        orderNo: string;
        orderName: string;
        customerId: string | null;
        contractId: string | null;
        contractName: string | null;
    }>;
}
