import { PrismaService } from '../prisma/prisma.service';
export declare class QuotationController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            remark: string | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            customerName: string | null;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            departmentName: string | null;
            quotationNo: string;
            quotationName: string;
            customerId: string | null;
            responsibleName: string | null;
            validUntil: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        departmentName: string | null;
        quotationNo: string;
        quotationName: string;
        customerId: string | null;
        responsibleName: string | null;
        validUntil: Date | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        departmentName: string | null;
        quotationNo: string;
        quotationName: string;
        customerId: string | null;
        responsibleName: string | null;
        validUntil: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        departmentName: string | null;
        quotationNo: string;
        quotationName: string;
        customerId: string | null;
        responsibleName: string | null;
        validUntil: Date | null;
    }>;
}
