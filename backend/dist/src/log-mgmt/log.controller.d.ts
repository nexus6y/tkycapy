import { PrismaService } from '../prisma/prisma.service';
export declare class OperationLogController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            status: number | null;
            username: string | null;
            userId: string | null;
            moduleName: string | null;
            businessName: string | null;
            method: string | null;
            ipAddress: string | null;
            requestUrl: string | null;
            requestMethod: string | null;
            requestParams: import("@prisma/client/runtime/client").JsonValue | null;
            responseResult: import("@prisma/client/runtime/client").JsonValue | null;
            errorMsg: string | null;
            costTime: number | null;
            operatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
export declare class LoginLogController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            status: number | null;
            username: string | null;
            userId: string | null;
            ipAddress: string | null;
            loginLocation: string | null;
            browser: string | null;
            os: string | null;
            msg: string | null;
            loginTime: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
