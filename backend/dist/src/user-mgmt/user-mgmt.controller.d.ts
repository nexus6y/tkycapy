import { PrismaService } from '../prisma/prisma.service';
export declare class UserMgmtController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(username?: string, name?: string, status?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            username: string;
            email: string | null;
            phone: string | null;
            lastLoginAt: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
