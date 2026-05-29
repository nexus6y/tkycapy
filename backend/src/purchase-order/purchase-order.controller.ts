import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}

  private async tid() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('bizStatus') bizStatus?: string,
    @Query('code') code?: string,
    @Query('name') name?: string,
    @Query('supplier') supplier?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 30,
    @Query('mode') mode?: string,
  ) {
    const tenantId = await this.tid();
    const where: any = { tenantId };
    if (status) where.approvalStatus = status;
    if (bizStatus) where.businessStatus = bizStatus;
    if (code) where.orderNo = { contains: code };
    if (name) where.orderName = { contains: name };
    if (supplier) where.supplierName = { contains: supplier };

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (+page - 1) * +pageSize,
        take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.purchaseOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const data: any = { ...dto, tenantId };
    // Auto-generate order number if not provided
    if (!data.orderNo) {
      data.orderNo = await this.codeGen.generate('PO', 'purchaseOrder', 'orderNo');
    }
    // Date conversions
    if (data.expectedDeliveryDate) data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (data.totalAmount != null && data.totalAmount !== '') data.totalAmount = String(data.totalAmount);
    else delete data.totalAmount;

    // Extract lines if provided
    const { lines, ...orderData } = data;

    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.purchaseOrder.create({
        data: {
          ...orderData,
          lines: {
            create: lines.map((l: any, i: number) => ({
              tenantId,
              lineNo: l.lineNo ?? i + 1,
              materialCode: l.materialCode,
              materialName: l.materialName,
              spec: l.spec,
              unit: l.unit,
              quantity: l.quantity != null ? String(l.quantity) : null,
              unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
              amount: l.amount != null ? String(l.amount) : null,
              requiredDate: l.requiredDate ? new Date(l.requiredDate) : null,
              warehouseCode: l.warehouseCode,
            })),
          },
        },
        include: { lines: true },
      });
    }

    return this.prisma.purchaseOrder.create({ data: orderData });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const data: any = { ...dto };
    if (data.expectedDeliveryDate) data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (data.totalAmount != null && data.totalAmount !== '') data.totalAmount = String(data.totalAmount);
    else delete data.totalAmount;

    const { lines, ...orderData } = data;

    // If lines provided, replace all lines
    if (lines !== undefined) {
      // Delete existing lines
      await this.prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
      // Create new lines
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.purchaseOrderLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId,
            purchaseOrderId: id,
            lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode,
            materialName: l.materialName,
            spec: l.spec,
            unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            requiredDate: l.requiredDate ? new Date(l.requiredDate) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: orderData,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Delete lines first
    await this.prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'purchaseOrder', id);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { approvalStatus: 'SUBMITTED' } as any,
    });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'purchaseOrder', id);
    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { approvalStatus: 'APPROVED' } as any,
    });

    // Auto-create inspection draft for purchased materials
    const tenantId = await this.tid();
    const orderWithLines = await this.prisma.purchaseOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    const insNo = await this.codeGen.generate('INS', 'inspection', 'inspectionNo');
    const inspectionData: any = {
      tenantId,
      inspectionNo: insNo,
      sourceType: 'PURCHASE_ORDER',
      sourceNo: order.orderNo,
      materialName: order.orderName,
      quantity: '0',
      qualifiedQty: '0',
      unqualifiedQty: '0',
      approvalStatus: 'DRAFT',
      businessStatus: 'PENDING',
    };

    if (orderWithLines.lines && orderWithLines.lines.length > 0) {
      const totalQty = orderWithLines.lines.reduce((s, l) => s + Number(l.quantity || 0), 0);
      inspectionData.quantity = String(totalQty);
      inspectionData.lines = {
        create: orderWithLines.lines.map((l, i) => ({
          tenantId,
          lineNo: l.lineNo ?? i + 1,
          materialCode: l.materialCode,
          materialName: l.materialName,
          spec: l.spec,
          unit: l.unit,
          inspectQty: l.quantity != null ? String(l.quantity) : null,
          qualifiedQty: '0',
          unqualifiedQty: '0',
          result: 'PENDING',
          warehouseCode: l.warehouseCode,
        })),
      };
    }

    await this.prisma.inspection.create({ data: inspectionData });

    return order;
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    await guardWithdraw(this.prisma, 'purchaseOrder', id);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { approvalStatus: 'DRAFT' } as any,
    });
  }
}
