import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove } from '../common/business-rules.helper';

@Controller('quotations')
export class QuotationController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}

  private async tid() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string,
    @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30,
    @Query('mode') mode?: string) {
    const tenantId = await this.tid();
    const where: any = { tenantId };
    if (status) where.approvalStatus = status;
    if (code) where.quotationNo = { contains: code };
    if (name) where.quotationName = { contains: name };
    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.quotation.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.quotation.findUniqueOrThrow({
      where: { id }, include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    if (!dto.quotationNo) dto.quotationNo = await this.codeGen.generate('QTE', 'quotation', 'quotationNo');
    const { lines, ...orderData } = dto;
    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.quotation.create({
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
    return this.prisma.quotation.create({ data: { ...orderData, tenantId } as any });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...orderData } = dto;
    if (lines !== undefined) {
      await this.prisma.quotationLine.deleteMany({ where: { quotationId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.quotationLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, quotationId: id, lineNo: l.lineNo ?? i + 1,
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
    return this.prisma.quotation.update({
      where: { id }, data: orderData as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.quotationLine.deleteMany({ where: { quotationId: id } });
    await this.prisma.quotation.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'quotation', id);
    return this.prisma.quotation.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'quotation', id);
    await this.prisma.quotation.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    // No longer auto-create PreOrder — user must push-down explicitly via generate-pre-order
    return order;
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    const order = await this.prisma.quotation.findUniqueOrThrow({ where: { id } });
    if (order.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能撤回已提交的报价单');
    return this.prisma.quotation.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }

  @Put(':id/mark-result')
  async markResult(@Param('id') id: string, @Body() dto: { markResult: string }) {
    if (!['WON', 'LOST', 'PENDING'].includes(dto.markResult)) throw new BadRequestException('标记结果必须为 WON/LOST/PENDING');
    // WON should only be set via generate-pre-order; prevent manual WON to avoid inconsistency
    // between the UI button guard and the backend duplicate guard
    if (dto.markResult === 'WON') {
      const tenantId = await this.tid();
      const existing = await this.prisma.preOrder.findFirst({
        where: { quotationId: id, tenantId },
      });
      if (!existing) throw new BadRequestException('尚未生成分劈单，请使用"下推分劈单"按钮生成后再标记');
    }
    return this.prisma.quotation.update({ where: { id }, data: { markResult: dto.markResult } as any });
  }

  // Push-down: generate pre-order from quotation lines (idempotent)
  @Post(':id/generate-pre-order')
  async generatePreOrder(@Param('id') id: string) {
    const tenantId = await this.tid();
    return await this.prisma.$transaction(async (tx) => {
      const qt = await tx.quotation.findUniqueOrThrow({
        where: { id }, include: { lines: { orderBy: { lineNo: 'asc' } } },
      });

      if (qt.approvalStatus !== 'APPROVED') {
        throw new BadRequestException('只能从已审批的报价单生成分劈单');
      }
      if (!qt.lines || qt.lines.length === 0) throw new BadRequestException('报价单没有明细行');

      // Idempotency: check by quotationId on PreOrder, not by markResult
      const existing = await tx.preOrder.findFirst({
        where: { quotationId: id, approvalStatus: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] } },
      });
      if (existing) throw new BadRequestException(`该报价单已存在分劈单 ${existing.orderNo}，不能重复下推`);

      const preNo = await this.codeGen.generate('PRE', 'preOrder', 'orderNo');
      // totalAmount = sum of each line's amount (or quantity*unitPrice if amount is missing)
      const totalAmt = qt.lines.reduce((s, l) => {
        const amt = num(l.amount) > 0 ? num(l.amount) : (num(l.quantity) * num(l.unitPrice));
        return s + amt;
      }, 0);

      await tx.preOrder.create({
        data: {
          tenantId, orderNo: preNo, orderName: qt.quotationName,
          quotationId: qt.id, quotationNo: qt.quotationNo,  // audit trail
          customerName: qt.customerName, totalAmount: String(totalAmt),
          approvalStatus: 'DRAFT',
          lines: { create: qt.lines.map((l, i) => ({
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

      // Mark quotation as WON after creating pre-order
      await tx.quotation.update({ where: { id }, data: { markResult: 'WON' } as any });

      return { message: '分劈单已生成', preOrderNo: preNo };
    });
  }
}

function num(v: any): number { try { return Number(v) || 0 } catch { return 0 } }
