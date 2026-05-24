import { PrismaService } from '../prisma/prisma.service';
export declare class MaterialParamController {
    private prisma;
    constructor(prisma: PrismaService);
    private getTenantId;
    get(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        codeFormat: string | null;
        allowDuplicateName: boolean;
        autoApproval: boolean;
        defaultStatus: import("@prisma/client").$Enums.CommonStatus;
    }>;
}
