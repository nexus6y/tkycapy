import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            sortOrder: number;
            username: string;
            email: string | null;
            phone: string | null;
            departmentId: string | null;
            dataScope: string | null;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
        };
        token: string;
    }>;
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.CommonStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            sortOrder: number;
            username: string;
            email: string | null;
            phone: string | null;
            departmentId: string | null;
            dataScope: string | null;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
        };
        token: string;
    }>;
}
