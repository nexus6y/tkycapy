import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

// ===== Whitelists: only fields in Prisma schema =====

const PRE_KEYS = [
  'orderNo','orderName','quotationId','quotationNo','contractId','contractName',
  'customerId','customerCode','customerName','totalAmount','approvalStatus','remark','tenantId',
];

/** PreOrderLine schema fields (excludes id/tenantId/preOrderId — those are set by server) */
const PRE_LINE_KEYS = [
  'materialCode','materialName','spec','unit','quantity','unitPrice','amount',
  'deliveryDate','warehouseCode','remark',
];

// ===== Cleaners =====

function cleanHeader(dto: any): any {
  const d = pickAllowed(dto, PRE_KEYS);
  for (const k of Object.keys(d)) {
    if (d[k] === '' || d[k] === null) delete d[k];
  }
  // Decimal: totalAmount
  if (d.totalAmount !== undefined && !isValidDecimal(d.totalAmount)) delete d.totalAmount;
  return d;
}

/**
 * Clean one line from frontend → safe Prisma create input.
 * - lineNo always Int (fallback to index+1)
 * - Strip empty strings and nulls
 * - Convert decimals only when valid
 * - Date only when parseable & non-empty
 */
function cleanPreOrderLine(raw: any, idx: number): any {
  // Start with only known fields
  const line: any = {};
  for (const k of PRE_LINE_KEYS) {
    const v = raw[k];
    if (v === undefined || v === null || v === '') continue;
    line[k] = v;
  }

  // lineNo: must be an integer ≥ 1
  line.lineNo = toLineNo(raw.lineNo, idx);

  // Decimal fields (quantity, unitPrice, amount): must be valid number strings
  for (const dk of ['quantity','unitPrice','amount']) {
    if (line[dk] !== undefined) {
      if (!isValidDecimal(line[dk])) delete line[dk];
      else line[dk] = String(line[dk]);
    }
  }

  // Date: empty / invalid → delete
  if (line.deliveryDate !== undefined) {
    const dd = parseDate(line.deliveryDate);
    if (dd) line.deliveryDate = dd;
    else delete line.deliveryDate;
  }

  return line;
}

// ===== Helpers =====

function toLineNo(v: any, idx: number): number {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 1) return Math.floor(v);
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  return idx + 1;
}

function isValidDecimal(v: any): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  if (s === '') return false;
  return !isNaN(Number(s)) && Number.isFinite(Number(s));
}

function parseDate(v: any): Date | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
}

// ===== Controller =====

@Controller('pre-orders')
export class PreOrderController {
  private readonly logger = new Logger(PreOrderController.name);

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

  // ========== CREATE ==========

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const { lines, ...rawData } = dto;

    // Header
    const data = cleanHeader(rawData);
    data.tenantId = tenantId;
    if (!data.orderNo) data.orderNo = await this.codeGen.generate('PRE', 'preOrder', 'orderNo');

    // Lines
    const cleanedLines = (Array.isArray(lines) ? lines : []).map((l: any, i: number) =>
      ({ tenantId, ...cleanPreOrderLine(l, i) }));

    try {
      const result = await this.prisma.preOrder.create({
        data: {
          ...data,
          ...(cleanedLines.length > 0 ? { lines: { create: cleanedLines } } : {}),
        } as any,
        include: { lines: true },
      });
      return result;
    } catch (e: any) {
      this.logger.error(`pre-order create failed: ${e.message}`, e.stack?.substring(0, 300));
      if (e.code === 'P2002') throw new BadRequestException('分劈单号已存在');
      if (e.code === 'P2003') throw new BadRequestException('关联数据不存在');
      if (e.code === 'P2025') throw new BadRequestException('记录未找到');
      // Re-throw raw so Prisma field-level errors are visible in server log
      throw e;
    }
  }

  // ========== UPDATE ==========

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...rawData } = dto;

    const data = cleanHeader(rawData);

    if (lines !== undefined) {
      await this.prisma.preOrderLine.deleteMany({ where: { preOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        const cleanedLines = lines.map((l: any, i: number) =>
          ({ tenantId, preOrderId: id, ...cleanPreOrderLine(l, i) }));
        await this.prisma.preOrderLine.createMany({ data: cleanedLines as any });
      }
    }

    return this.prisma.preOrder.update({
      where: { id }, data: data as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  // ========== WORKFLOW ==========

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
    return order;
  }

  // ========== PUSH-DOWN ==========

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
      const totalAmt = pre.lines.reduce((s, l) => {
        const amt = num(l.amount) > 0 ? num(l.amount) : (num(l.quantity) * num(l.unitPrice));
        return s + amt;
      }, 0);

      await tx.salesOrder.create({
        data: {
          tenantId, orderNo: soNo, orderName: pre.orderName,
          preOrderId: pre.id, preOrderNo: pre.orderNo,
          quotationId: pre.quotationId, quotationNo: pre.quotationNo,
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
