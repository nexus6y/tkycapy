import { PrismaService } from '../prisma/prisma.service';
export declare class MaterialParamController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    get(): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        codeFormat: string | null;
        allowDuplicateName: boolean;
        autoApproval: boolean;
        defaultStatus: import("@prisma/client").$Enums.CommonStatus;
    }>;
    update(dto: {
        codeFormat?: string;
        allowDuplicateName?: boolean;
        autoApproval?: boolean;
        defaultStatus?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        codeFormat: string | null;
        allowDuplicateName: boolean;
        autoApproval: boolean;
        defaultStatus: import("@prisma/client").$Enums.CommonStatus;
    }>;
}
