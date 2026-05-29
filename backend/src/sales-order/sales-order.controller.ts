import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

@Controller('sales-orders')
export class SalesOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}

  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('bizStatus') bizStatus?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (bizStatus) where.businessStatus = bizStatus; if (code) where.orderNo = { contains: code }; if (name) where.orderName = { contains: name };
    const [items, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.salesOrder.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.salesOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const data: any = { ...dto, tenantId };
    if (!data.orderNo) data.orderNo = await this.codeGen.generate('SO', 'salesOrder', 'orderNo');
    if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
    if (data.orderDate) data.orderDate = new Date(data.orderDate);
    if (data.totalAmount != null && data.totalAmount !== '') data.totalAmount = String(data.totalAmount);
    else delete data.totalAmount;

    const { lines, ...orderData } = data;
    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.salesOrder.create({
        data: {
          ...orderData,
          lines: { create: lines.map((l: any, i: number) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            deliveryDate: l.deliveryDate ? new Date(l.deliveryDate) : null,
            warehouseCode: l.warehouseCode,
          })) },
        },
        include: { lines: true },
      });
    }
    return this.prisma.salesOrder.create({ data: orderData });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const data: any = { ...dto };
    if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
    if (data.orderDate) data.orderDate = new Date(data.orderDate);
    if (data.totalAmount != null && data.totalAmount !== '') data.totalAmount = String(data.totalAmount);
    else delete data.totalAmount;

    const { lines, ...orderData } = data;
    if (lines !== undefined) {
      await this.prisma.salesOrderLine.deleteMany({ where: { salesOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.salesOrderLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, salesOrderId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            deliveryDate: l.deliveryDate ? new Date(l.deliveryDate) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }
    return this.prisma.salesOrder.update({
      where: { id }, data: orderData,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    await guardWithdraw(this.prisma, 'salesOrder', id);
    return this.prisma.salesOrder.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.salesOrderLine.deleteMany({ where: { salesOrderId: id } });
    await this.prisma.salesOrder.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'salesOrder', id);
    return this.prisma.salesOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'salesOrder', id);
    await this.prisma.salesOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    // NOTE: Production orders are now created via manual push-down or demand plan,
    // NOT auto-created unconditionally on sales order approval.
    return order;
  }
}
