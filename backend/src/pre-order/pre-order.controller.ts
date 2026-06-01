import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

@Controller('pre-orders')
export class PreOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code }; if (name) where.orderName = { contains: name };
    const [items, total] = await Promise.all([
      this.prisma.preOrder.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.preOrder.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.preOrder.findUniqueOrThrow({
      where: { id }, include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('PRE', 'preOrder', 'orderNo');
    const { lines, ...orderData } = dto;
    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.preOrder.create({
        data: { ...orderData, tenantId,
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
        } as any, include: { lines: true },
      });
    }
    return this.prisma.preOrder.create({ data: { ...orderData, tenantId } as any });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...orderData } = dto;
    if (lines !== undefined) {
      await this.prisma.preOrderLine.deleteMany({ where: { preOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.preOrderLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, preOrderId: id, lineNo: l.lineNo ?? i + 1,
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
    return this.prisma.preOrder.update({
      where: { id }, data: orderData as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    await guardWithdraw(this.prisma, 'preOrder', id);
    return this.prisma.preOrder.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.preOrderLine.deleteMany({ where: { preOrderId: id } });
    await this.prisma.preOrder.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'preOrder', id);
    return this.prisma.preOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'preOrder', id);
    await this.prisma.preOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    // No longer auto-create SalesOrder — user must push-down via generate-sales-order
    return order;
  }

  // Push-down: generate sales order from pre-order lines (idempotent)
  @Post(':id/generate-sales-order')
  async generateSalesOrder(@Param('id') id: string) {
    const tenantId = await this.tid();
    return await this.prisma.$transaction(async (tx) => {
      const pre = await tx.preOrder.findUniqueOrThrow({
        where: { id }, include: { lines: { orderBy: { lineNo: 'asc' } } },
      });

      if (pre.approvalStatus !== 'APPROVED') throw new BadRequestException('只能从已审批的分劈单生成销售订单');
      if (!pre.lines || pre.lines.length === 0) throw new BadRequestException('分劈单没有明细行');

      const existing = await tx.salesOrder.findFirst({
        where: { preOrderId: id, approvalStatus: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] } },
      });
      if (existing) throw new BadRequestException(`该分劈单已存在销售订单 ${existing.orderNo}，不能重复下推`);

      const soNo = await this.codeGen.generate('SO', 'salesOrder', 'orderNo');
      // totalAmount = sum of each line's amount (or quantity*unitPrice if amount is missing)
      const totalAmt = pre.lines.reduce((s, l) => {
        const amt = num(l.amount) > 0 ? num(l.amount) : (num(l.quantity) * num(l.unitPrice));
        return s + amt;
      }, 0);

      await tx.salesOrder.create({
        data: {
          tenantId, orderNo: soNo, orderName: pre.orderName,
          preOrderId: pre.id, preOrderNo: pre.orderNo,
          quotationId: pre.quotationId, quotationNo: pre.quotationNo,  // carry through audit trail
          customerName: pre.customerName, contractName: pre.contractName,
          totalAmount: String(totalAmt), approvalStatus: 'DRAFT',
          businessStatus: 'PENDING_SHIP',
          lines: { create: pre.lines.map((l, i) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode || '', materialName: l.materialName || '',
            spec: l.spec || '', unit: l.unit || '',
            quantity: l.quantity != null ? String(l.quantity) : '0',
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            deliveryDate: l.deliveryDate, warehouseCode: l.warehouseCode || '',
          })) },
        } as any,
      });

      return { message: '销售订单已生成', salesOrderNo: soNo };
    });
  }
}

function num(v: any): number { try { return Number(v) || 0 } catch { return 0 } }
