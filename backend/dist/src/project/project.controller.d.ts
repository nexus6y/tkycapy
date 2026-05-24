import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(status?: string, code?: string, name?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            source: string | null;
            organizationId: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        source: string | null;
        organizationId: string | null;
    }>;
    create(dto: {
        code: string;
        name: string;
        source?: string;
    }): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        source: string | null;
        organizationId: string | null;
    }>;
    update(id: string, dto: {
        name?: string;
        source?: string;
    }): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        source: string | null;
        organizationId: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        source: string | null;
        organizationId: string | null;
    }>;
}
