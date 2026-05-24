import { PrismaService } from '../prisma/prisma.service';
export declare class QuotationController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            remark: string | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            customerName: string | null;
            totalAmount: import("@prisma/client/runtime/client").Decimal | null;
            quotationNo: string;
            quotationName: string;
            customerId: string | null;
            departmentName: string | null;
            responsibleName: string | null;
            validUntil: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        quotationNo: string;
        quotationName: string;
        customerId: string | null;
        departmentName: string | null;
        responsibleName: string | null;
        validUntil: Date | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        quotationNo: string;
        quotationName: string;
        customerId: string | null;
        departmentName: string | null;
        responsibleName: string | null;
        validUntil: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        remark: string | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        customerName: string | null;
        totalAmount: import("@prisma/client/runtime/client").Decimal | null;
        quotationNo: string;
        quotationName: string;
        customerId: string | null;
        departmentName: string | null;
        responsibleName: string | null;
        validUntil: Date | null;
    }>;
}
