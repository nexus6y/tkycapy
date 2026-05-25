import { PrismaService } from '../prisma/prisma.service';
export declare class MenuMgmtController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        sortOrder: number;
        parentId: string | null;
        type: string;
        path: string | null;
        icon: string | null;
        component: string | null;
    }[]>;
    create(dto: any): Promise<{
        id: string;
        code: string;
        name: string;
        status: import("@prisma/client").$Enums.CommonStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        sortOrder: number;
        parentId: string | null;
        type: string;
        path: string | null;
        icon: string | null;
        component: string | null;
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
        sortOrder: number;
        parentId: string | null;
        type: string;
        path: string | null;
        icon: string | null;
        component: string | null;
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
        createdAt: Date;
        roleId: string;
        permission: string;
        type: string;
        menuId: string | null;
    })[]>;
    create(dto: any): Promise<{
        id: string;
        createdAt: Date;
        roleId: string;
        permission: string;
        type: string;
        menuId: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
