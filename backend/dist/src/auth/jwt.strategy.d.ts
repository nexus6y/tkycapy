import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: {
        sub: string;
        username: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        updatedAt: Date;
        deletedAt: Date | null;
        sortOrder: number;
        username: string;
        email: string | null;
        phone: string | null;
        departmentId: string | null;
        dataScope: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
    }>;
}
export {};
