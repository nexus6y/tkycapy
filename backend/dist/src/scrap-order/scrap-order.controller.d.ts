import { PrismaService } from '../prisma/prisma.service';
export declare class ScrapOrderController {
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
            orderNo: string;
            materialName: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal | null;
            businessStatus: string;
            scrapReason: string | null;
            disposalMethod: string | null;
            scrapDate: Date;
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
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        businessStatus: string;
        scrapReason: string | null;
        disposalMethod: string | null;
        scrapDate: Date;
    }>;
    create(dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        businessStatus: string;
        scrapReason: string | null;
        disposalMethod: string | null;
        scrapDate: Date;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        orderNo: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        businessStatus: string;
        scrapReason: string | null;
        disposalMethod: string | null;
        scrapDate: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
