import { PrismaService } from '../prisma/prisma.service';
export declare class SupplierController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
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
            taxId: string | null;
            bankName: string | null;
            bankAccount: string | null;
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
        taxId: string | null;
        bankName: string | null;
        bankAccount: string | null;
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
        taxId: string | null;
        bankName: string | null;
        bankAccount: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
