import { PrismaService } from '../prisma/prisma.service';
export declare class DemandPlanController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            remark: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            projectId: string | null;
            businessStatus: string;
            planNo: string;
            planName: string;
            demandSource: string | null;
            demandUse: string | null;
            projectName: string | null;
            requiredDate: Date | null;
            totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        projectId: string | null;
        businessStatus: string;
        planNo: string;
        planName: string;
        demandSource: string | null;
        demandUse: string | null;
        projectName: string | null;
        requiredDate: Date | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        projectId: string | null;
        businessStatus: string;
        planNo: string;
        planName: string;
        demandSource: string | null;
        demandUse: string | null;
        projectName: string | null;
        requiredDate: Date | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        tenantId: string;
        remark: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        projectId: string | null;
        businessStatus: string;
        planNo: string;
        planName: string;
        demandSource: string | null;
        demandUse: string | null;
        projectName: string | null;
        requiredDate: Date | null;
        totalQuantity: import("@prisma/client/runtime/client").Decimal | null;
    }>;
}
