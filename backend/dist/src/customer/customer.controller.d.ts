import { PrismaService } from '../prisma/prisma.service';
export declare class CustomerController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(code?: string, name?: string, status?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            tenantId: string;
            code: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            contactPerson: string | null;
            contactPhone: string | null;
            contactEmail: string | null;
            address: string | null;
            creditLevel: string | null;
            industry: string | null;
            valueLevel: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        contactPerson: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        address: string | null;
        creditLevel: string | null;
        industry: string | null;
        valueLevel: string | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        contactPerson: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        address: string | null;
        creditLevel: string | null;
        industry: string | null;
        valueLevel: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
