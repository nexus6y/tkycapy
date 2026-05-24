import { PrismaService } from '../prisma/prisma.service';
export declare class CustomerController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    findAll(code?: string, name?: string, status?: string, page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            code: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            industry: string | null;
            valueLevel: string | null;
            creditLevel: string | null;
            contactPerson: string | null;
            contactPhone: string | null;
            contactEmail: string | null;
            address: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<{
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        industry: string | null;
        valueLevel: string | null;
        creditLevel: string | null;
        contactPerson: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        address: string | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        industry: string | null;
        valueLevel: string | null;
        creditLevel: string | null;
        contactPerson: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        address: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
