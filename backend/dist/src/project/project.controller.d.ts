import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            name: string;
            code: string;
            source: string | null;
            organizationId: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        source: string | null;
        organizationId: string | null;
    }>;
    create(dto: {
        code: string;
        name: string;
        source?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        source: string | null;
        organizationId: string | null;
    }>;
    update(id: string, dto: {
        name?: string;
        source?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        source: string | null;
        organizationId: string | null;
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
        name: string;
        code: string;
        source: string | null;
        organizationId: string | null;
    }>;
}
