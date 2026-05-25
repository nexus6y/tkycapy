import { PrismaService } from '../prisma/prisma.service';
export declare class RoleMgmtController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            code: string;
            name: string;
            description: string | null;
            sortOrder: number;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
