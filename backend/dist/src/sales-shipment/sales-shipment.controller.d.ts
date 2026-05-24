import { PrismaService } from '../prisma/prisma.service';
export declare class SalesShipmentController {
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
            orderNo: string | null;
            businessStatus: string;
            shipmentNo: string;
            orderId: string | null;
            shipmentDate: Date;
            totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
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
        orderNo: string | null;
        businessStatus: string;
        shipmentNo: string;
        orderId: string | null;
        shipmentDate: Date;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
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
        orderNo: string | null;
        businessStatus: string;
        shipmentNo: string;
        orderId: string | null;
        shipmentDate: Date;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
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
        orderNo: string | null;
        businessStatus: string;
        shipmentNo: string;
        orderId: string | null;
        shipmentDate: Date;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
    }>;
}
