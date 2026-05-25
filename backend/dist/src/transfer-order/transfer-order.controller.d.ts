import { PrismaService } from '../prisma/prisma.service';
export declare class TransferOrderController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            remark: string | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            type: string;
            orderNo: string;
            materialName: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal | null;
            fromWarehouse: string | null;
            toWarehouse: string | null;
            businessStatus: string;
            transferDate: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        type: string;
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        fromWarehouse: string | null;
        toWarehouse: string | null;
        businessStatus: string;
        transferDate: Date;
    }>;
    create(dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        type: string;
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        fromWarehouse: string | null;
        toWarehouse: string | null;
        businessStatus: string;
        transferDate: Date;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        type: string;
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        fromWarehouse: string | null;
        toWarehouse: string | null;
        businessStatus: string;
        transferDate: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
