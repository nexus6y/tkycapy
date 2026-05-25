import { PrismaService } from '../prisma/prisma.service';
export declare class InboundOrderController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(status?: string, code?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            specification: string | null;
            remark: string | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            orderNo: string;
            materialName: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal | null;
            qualifiedQty: import("@prisma/client/runtime/client").Decimal | null;
            unqualifiedQty: import("@prisma/client/runtime/client").Decimal | null;
            warehouseId: string | null;
            warehouseName: string | null;
            unitPrice: import("@prisma/client/runtime/client").Decimal | null;
            businessStatus: string;
            receiptDate: Date;
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
        specification: string | null;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        qualifiedQty: import("@prisma/client/runtime/client").Decimal | null;
        unqualifiedQty: import("@prisma/client/runtime/client").Decimal | null;
        warehouseId: string | null;
        warehouseName: string | null;
        unitPrice: import("@prisma/client/runtime/client").Decimal | null;
        businessStatus: string;
        receiptDate: Date;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        specification: string | null;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        qualifiedQty: import("@prisma/client/runtime/client").Decimal | null;
        unqualifiedQty: import("@prisma/client/runtime/client").Decimal | null;
        warehouseId: string | null;
        warehouseName: string | null;
        unitPrice: import("@prisma/client/runtime/client").Decimal | null;
        businessStatus: string;
        receiptDate: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
