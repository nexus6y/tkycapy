import { PrismaService } from '../prisma/prisma.service';
export declare class ScrapOrderController {
    private prisma;
    constructor(prisma: PrismaService);
    private tid;
    findAll(page?: number, pageSize?: number): Promise<{
        items: any;
        total: any;
        page: number;
        pageSize: number;
    }>;
    create(dto: any): Promise<any>;
    update(id: string, dto: any): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
