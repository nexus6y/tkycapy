import { PrismaService } from '../prisma/prisma.service';
export declare class UserMgmtController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(username?: string, name?: string, status?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            username: string;
            name: string;
            email: string | null;
            phone: string | null;
            status: import("@prisma/client").$Enums.CommonStatus;
            lastLoginAt: Date | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
