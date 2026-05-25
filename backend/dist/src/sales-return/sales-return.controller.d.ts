import { PrismaService } from '../prisma/prisma.service';
export declare class SalesReturnController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            businessStatus: string;
            remark: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            customerName: string | null;
            totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
            shipmentNo: string | null;
            returnNo: string;
            shipmentId: string | null;
            returnDate: Date;
            returnReason: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        businessStatus: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        customerName: string | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
        shipmentNo: string | null;
        returnNo: string;
        shipmentId: string | null;
        returnDate: Date;
        returnReason: string | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        businessStatus: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        customerName: string | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
        shipmentNo: string | null;
        returnNo: string;
        shipmentId: string | null;
        returnDate: Date;
        returnReason: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        tenantId: string;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        businessStatus: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        customerName: string | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
        shipmentNo: string | null;
        returnNo: string;
        shipmentId: string | null;
        returnDate: Date;
        returnReason: string | null;
    }>;
}
