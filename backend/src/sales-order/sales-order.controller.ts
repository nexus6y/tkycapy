import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pickAllowed } from '../common/dto-normalizer';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

// ===== Whitelists =====

const SO_KEYS = [
  'orderNo','orderName','preOrderId','preOrderNo','quotationId','quotationNo',
  'customerId','customerName','projectId','projectName','contractId','contractName',
  'orderType','orderDate','deliveryDate','totalAmount','approvalStatus','businessStatus','remark','tenantId',
];

/** SalesOrderLine schema fields (excludes id/tenantId/salesOrderId — server-set) */
const SO_LINE_KEYS = [
  'materialCode','materialName','spec','unit','quantity','unitPrice','amount',
  'deliveryDate','shippedQty','warehouseCode','remark',
];

// ===== Cleaners =====

function cleanHeader(dto: any): any {
  const d = pickAllowed(dto, SO_KEYS);
  for (const k of Object.keys(d)) {
    if (d[k] === '' || d[k] === null) delete d[k];
  }
  // Decimal
  if (d.totalAmount !== undefined && !isValidDecimal(d.totalAmount)) delete d.totalAmount;
  return d;
}

function cleanSalesOrderLine(raw: any, idx: number): any {
  const line: any = {};
  for (const k of SO_LINE_KEYS) {
    const v = raw[k];
    if (v === undefined || v === null || v === '') continue;
    line[k] = v;
  }

  line.lineNo = toLineNo(raw.lineNo, idx);

  for (const dk of ['quantity','unitPrice','amount','shippedQty']) {
    if (line[dk] !== undefined) {
      if (!isValidDecimal(line[dk])) delete line[dk];
      else line[dk] = String(line[dk]);
    }
  }

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
  const n = Number(s);
  return !isNaN(n) && Number.isFinite(n);
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

@Controller('sales-orders')
export class SalesOrderController {
  private readonly logger = new Logger(SalesOrderController.name);

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

  // ========== CREATE ==========

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const { lines, ...rawData } = dto;

    const data = cleanHeader(rawData);
    data.tenantId = tenantId;
    if (!data.orderNo) data.orderNo = await this.codeGen.generate('SO', 'salesOrder', 'orderNo');

    // Dates
    if (data.deliveryDate) data.deliveryDate = parseDate(data.deliveryDate);
    if (data.orderDate) data.orderDate = parseDate(data.orderDate);

    const cleanedLines = (Array.isArray(lines) ? lines : []).map((l: any, i: number) =>
      ({ tenantId, ...cleanSalesOrderLine(l, i) }));

    try {
      const result = await this.prisma.salesOrder.create({
        data: {
          ...data,
          ...(cleanedLines.length > 0 ? { lines: { create: cleanedLines } } : {}),
        } as any,
        include: { lines: true },
      });
      return result;
    } catch (e: any) {
      this.logger.error(`sales-order create failed: ${e.message}`, e.stack?.substring(0, 300));
      if (e.code === 'P2002') throw new BadRequestException('销售订单号已存在');
      if (e.code === 'P2003') throw new BadRequestException('关联数据不存在');
      if (e.code === 'P2025') throw new BadRequestException('记录未找到');
      throw e;
    }
  }

  // ========== UPDATE ==========

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...rawData } = dto;

    const data = cleanHeader(rawData);
    if (data.deliveryDate) data.deliveryDate = parseDate(data.deliveryDate);
    if (data.orderDate) data.orderDate = parseDate(data.orderDate);

    if (lines !== undefined) {
      await this.prisma.salesOrderLine.deleteMany({ where: { salesOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        const cleanedLines = lines.map((l: any, i: number) =>
          ({ tenantId, salesOrderId: id, ...cleanSalesOrderLine(l, i) }));
        await this.prisma.salesOrderLine.createMany({ data: cleanedLines as any });
      }
    }

    return this.prisma.salesOrder.update({
      where: { id }, data: data as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  // ========== WORKFLOW ==========

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
    return order;
  }
}
