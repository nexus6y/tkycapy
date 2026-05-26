import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("adjust-orders")
export class AdjustOrderController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get() async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.adjustOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.adjustOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.adjustOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.adjustOrder.create({ data: { ...dto, tenantId } as any }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.adjustOrder.update({ where: { id }, data: dto as any }); }
  @Put(":id/submit") async submit(@Param("id") id: string) { return this.prisma.adjustOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any }); }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.adjustOrder.delete({ where: { id } }); return { message: "删除成功" }; }
}
