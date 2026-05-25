import { PrismaService } from '../prisma/prisma.service';
export declare class BomController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(status?: string, code?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            materialName: string | null;
            quantity: import("@prisma/client/runtime/client").Decimal | null;
            approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            name: string;
            code: string;
            materialId: string | null;
            version: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        materialId: string | null;
        version: string | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        materialId: string | null;
        version: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submit(id: string): Promise<{
        id: string;
        tenantId: string;
        materialName: string | null;
        quantity: import("@prisma/client/runtime/client").Decimal | null;
        approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        code: string;
        materialId: string | null;
        version: string | null;
    }>;
}
