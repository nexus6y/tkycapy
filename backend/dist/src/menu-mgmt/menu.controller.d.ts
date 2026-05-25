import { PrismaService } from '../prisma/prisma.service';
export declare class MenuMgmtController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        tenantId: string;
        code: string;
        name: string;
        parentId: string | null;
        path: string | null;
        icon: string | null;
        component: string | null;
        sortOrder: number;
        type: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    create(dto: any): Promise<{
        id: string;
        tenantId: string;
        code: string;
        name: string;
        parentId: string | null;
        path: string | null;
        icon: string | null;
        component: string | null;
        sortOrder: number;
        type: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        tenantId: string;
        code: string;
        name: string;
        parentId: string | null;
        path: string | null;
        icon: string | null;
        component: string | null;
        sortOrder: number;
        type: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
export declare class PermissionMgmtController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        role: {
            name: string;
        };
    } & {
        id: string;
        type: string;
        createdAt: Date;
        permission: string;
        roleId: string;
        menuId: string | null;
    })[]>;
    create(dto: any): Promise<{
        id: string;
        type: string;
        createdAt: Date;
        permission: string;
        roleId: string;
        menuId: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
