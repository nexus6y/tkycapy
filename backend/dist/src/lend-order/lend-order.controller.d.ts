import { PrismaService } from '../prisma/prisma.service';
export declare class LendOrderController {
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
            businessStatus: string;
            borrower: string | null;
            borrowDate: Date;
            expectedReturn: Date | null;
            actualReturn: Date | null;
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
        businessStatus: string;
        borrower: string | null;
        borrowDate: Date;
        expectedReturn: Date | null;
        actualReturn: Date | null;
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
        businessStatus: string;
        borrower: string | null;
        borrowDate: Date;
        expectedReturn: Date | null;
        actualReturn: Date | null;
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
        businessStatus: string;
        borrower: string | null;
        borrowDate: Date;
        expectedReturn: Date | null;
        actualReturn: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
