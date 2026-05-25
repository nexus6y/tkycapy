import { PrismaService } from '../prisma/prisma.service';
export declare class OutboundOrderController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(status?: string, code?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            orderNo: string;
            materialName: string | null;
            specification: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal | null;
            warehouseId: string | null;
            warehouseName: string | null;
            unitPrice: import("@prisma/client/runtime/client").Decimal | null;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            businessStatus: string;
            remark: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            shipmentDate: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        orderNo: string;
        materialName: string | null;
        specification: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        warehouseId: string | null;
        warehouseName: string | null;
        unitPrice: import("@prisma/client/runtime/client").Decimal | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        businessStatus: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        shipmentDate: Date;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        orderNo: string;
        materialName: string | null;
        specification: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        warehouseId: string | null;
        warehouseName: string | null;
        unitPrice: import("@prisma/client/runtime/client").Decimal | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        businessStatus: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        shipmentDate: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
