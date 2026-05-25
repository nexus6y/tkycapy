import { PrismaService } from '../prisma/prisma.service';
export declare class RoleMgmtController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            code: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            description: string | null;
            sortOrder: number;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
