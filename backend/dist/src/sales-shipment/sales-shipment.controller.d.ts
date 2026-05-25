import { PrismaService } from '../prisma/prisma.service';
export declare class SalesShipmentController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            orderNo: string | null;
            businessStatus: string;
            remark: string | null;
            customerName: string | null;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
            shipmentNo: string;
            orderId: string | null;
            shipmentDate: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        orderNo: string | null;
        businessStatus: string;
        remark: string | null;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
        shipmentNo: string;
        orderId: string | null;
        shipmentDate: Date;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        orderNo: string | null;
        businessStatus: string;
        remark: string | null;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
        shipmentNo: string;
        orderId: string | null;
        shipmentDate: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        orderNo: string | null;
        businessStatus: string;
        remark: string | null;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
        shipmentNo: string;
        orderId: string | null;
        shipmentDate: Date;
    }>;
}
