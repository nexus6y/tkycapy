import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit } from '../common/business-rules.helper';
import { pickAllowed } from '../common/dto-normalizer';

const INB_KEYS = ['orderNo','sourceType','sourceNo','sourceLineNo','inspectionNo','supplierId','supplierName','materialName','specification','quantity','qualifiedQty','unqualifiedQty','warehouseId','warehouseCode','warehouseName','unitPrice','totalAmount','approvalStatus','businessStatus','receiptDate','remark','tenantId'];

function cleanInbound(dto: any, tenantId: string): any {
  const data = pickAllowed(dto, INB_KEYS);
  data.tenantId = tenantId;
  for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
  if (data.receiptDate) data.receiptDate = new Date(data.receiptDate);
  ['quantity','qualifiedQty','unqualifiedQty','unitPrice','totalAmount'].forEach(f => {
    if (data[f] != null) data[f] = String(data[f]);
  });
  return data;
}

@Controller('inbound-orders')
export class InboundOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([
      this.prisma.inboundOrder.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.inboundOrder.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.inboundOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('IN', 'inboundOrder', 'orderNo');

    // Idempotency: prevent duplicate inbound from same source document
    if (dto.sourceNo && dto.sourceType) {
      // Cross-source guard: if source is a PO, check whether materials need inspection
      if (dto.sourceType === 'PURCHASE') {
        const po = await this.prisma.purchaseOrder.findFirst({
          where: { tenantId, orderNo: dto.sourceNo },
          include: { lines: true },
        });
        if (po) {
          if (po.approvalStatus !== 'APPROVED') {
            throw new BadRequestException('该采购订单尚未审批通过，不能手动生成入库单');
          }
          const matCodes = [...new Set((po.lines || []).map((l: any) => l.materialCode).filter(Boolean))] as string[];
          if (matCodes.length > 0) {
            const materials = await this.prisma.material.findMany({
              where: { tenantId, code: { in: matCodes } },
              select: { code: true, needInspection: true },
            });
            if (materials.some(m => m.needInspection)) {
              throw new BadRequestException('该采购订单包含需质检物料，请通过质检流程入库，不能手动生成入库单');
            }
          }
        }
      }

      // Exact match (same sourceType + sourceNo)
      const existing = await this.prisma.inboundOrder.findFirst({
        where: { tenantId, sourceNo: dto.sourceNo, sourceType: dto.sourceType },
      });
      if (existing) {
        throw new BadRequestException(
          `来源单 ${dto.sourceNo} 已生成入库单 ${existing.orderNo}，不能重复生成`
        );
      }
      // Cross-guard: same sourceNo via different sourceType (e.g. manual + arrival-confirm for same PO)
      const crossExisting = await this.prisma.inboundOrder.findFirst({
        where: { tenantId, sourceNo: dto.sourceNo, sourceType: { not: dto.sourceType } },
      });
      if (crossExisting) {
        throw new BadRequestException(
          `来源单 ${dto.sourceNo} 已生成入库单 ${crossExisting.orderNo}（来源类型：${crossExisting.sourceType}），不能重复生成`
        );
      }
    }

    const lines = Array.isArray(dto.lines) ? dto.lines : null;
    const orderData = cleanInbound(dto, tenantId);

    if (lines && lines.length > 0) {
      return this.prisma.inboundOrder.create({
        data: {
          ...orderData,
          lines: { create: lines.map((l: any, i: number) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            warehouseCode: l.warehouseCode, locationCode: l.locationCode,
            batchNo: l.batchNo,
          })) },
        },
        include: { lines: true },
      });
    }
    return this.prisma.inboundOrder.create({ data: orderData });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...orderData } = dto;
    if (lines !== undefined) {
      await this.prisma.inboundOrderLine.deleteMany({ where: { inboundOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.inboundOrderLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, inboundOrderId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            warehouseCode: l.warehouseCode, locationCode: l.locationCode, batchNo: l.batchNo,
          })),
        });
      }
    }
    return this.prisma.inboundOrder.update({
      where: { id }, data: orderData as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'inboundOrder', id);
    return this.prisma.inboundOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await this.prisma.inboundOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
    if (order.approvalStatus !== 'SUBMITTED') throw new Error('只能审批已提交的入库单');

    const tenantId = await this.tid();
    const lines = order.lines && order.lines.length > 0 ? order.lines : [{
      materialCode: null, materialName: order.materialName, spec: order.specification,
      unit: null, quantity: order.quantity, unitPrice: order.unitPrice,
      amount: order.totalAmount, warehouseCode: order.warehouseCode || order.warehouseName,
      locationCode: null, batchNo: null,
    } as any];

    // Phase 0: resolve missing warehouseCodes from material default or existing inventory
    const noWhLines = lines.filter((l: any) => !(l.warehouseCode || order.warehouseCode || order.warehouseName));
    if (noWhLines.length > 0) {
      const matCodes = [...new Set(noWhLines.map((l: any) => (l.materialCode || '').trim()).filter(Boolean))] as string[];
      const matWhMap = new Map<string, string>(); // materialCode → warehouseCode
      if (matCodes.length > 0) {
        // ① Material default warehouse
        const materials = await this.prisma.material.findMany({
          where: { tenantId, code: { in: matCodes } },
          select: { code: true, defaultWarehouseId: true },
        });
        const whIds = [...new Set(materials.map(m => m.defaultWarehouseId).filter((id): id is string => !!id))];
        const whIdToCode = new Map<string, string>();
        if (whIds.length > 0) {
          const whs = await this.prisma.warehouse.findMany({
            where: { tenantId, id: { in: whIds } },
            select: { id: true, code: true },
          });
          for (const w of whs) whIdToCode.set(w.id, w.code);
        }
        for (const m of materials) {
          if (m.defaultWarehouseId && whIdToCode.has(m.defaultWarehouseId)) {
            matWhMap.set(m.code, whIdToCode.get(m.defaultWarehouseId)!);
          }
        }
        // ② Inventory fallback
        const stillMissing = matCodes.filter(c => !matWhMap.has(c));
        if (stillMissing.length > 0) {
          const invs = await this.prisma.inventory.findMany({
            where: { tenantId, materialCode: { in: stillMissing }, qualityStatus: 'QUALIFIED' },
            select: { materialCode: true, warehouseCode: true },
            orderBy: { quantity: 'desc' },
          });
          const seen = new Set<string>();
          for (const inv of invs) {
            if (inv.materialCode && inv.warehouseCode && !matWhMap.has(inv.materialCode) && !seen.has(inv.materialCode)) {
              matWhMap.set(inv.materialCode, inv.warehouseCode);
              seen.add(inv.materialCode);
            }
          }
        }
      }
      for (const line of noWhLines) {
        const wc = matWhMap.get((line.materialCode || '').trim());
        if (wc) (line as any).warehouseCode = wc;
      }
    }

    // Phase 1: validate + prepare operations
    const operations: any[] = [];

    for (const line of lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || order.warehouseCode || order.warehouseName || '').trim();
      const qty = Number(line.quantity || 0);

      if (!matCode) throw new Error(`入库登卡失败：明细行缺少物料编码 (${line.materialName || '未知物料'})`);
      if (!whCode) throw new Error(`入库登卡失败：明细行缺少仓库编码 (物料 ${matCode})`);
      if (qty <= 0) throw new Error(`入库登卡失败：明细行数量必须大于0 (物料 ${matCode})`);

      const locCode = (line.locationCode || '').trim();
      const batch = (line.batchNo || '').trim();

      const existing = await this.prisma.inventory.findFirst({ where: {
        tenantId, materialCode: matCode, warehouseCode: whCode,
        locationCode: locCode || '', batchNo: batch || '',
        qualityStatus: 'QUALIFIED', projectCode: '',
      } as any });

      const price = Number(line.unitPrice || order.unitPrice || 0);
      const amt = Number(line.amount || order.totalAmount || 0) || qty * price;
      const newBalance = String((Number(existing?.quantity || 0)) + qty);

      if (existing) {
        operations.push(
          this.prisma.inventory.update({
            where: { id: existing.id },
            data: { quantity: String((Number(existing.quantity) || 0) + qty), availableQty: String((Number(existing.availableQty) || 0) + qty) },
          }),
        );
      } else {
        operations.push(
          this.prisma.inventory.create({
            data: { tenantId, materialCode: matCode, materialName: line.materialName || order.materialName, spec: line.spec || order.specification, unit: line.unit, warehouseCode: whCode, locationCode: locCode || '', batchNo: batch || '', qualityStatus: 'QUALIFIED', projectCode: '', quantity: String(qty), availableQty: String(qty), lockedQty: '0' } as any,
          }),
        );
      }

      operations.push(
        this.prisma.inventoryTransaction.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: 'IN', sourceType: 'inbound_order', sourceNo: order.orderNo, sourceLineNo: line.lineNo ?? 1, materialCode: matCode, materialName: line.materialName || order.materialName, spec: line.spec || order.specification, unit: line.unit, warehouseCode: whCode, locationCode: locCode || '', batchNo: batch || '', qualityStatus: 'QUALIFIED', quantity: String(qty), unitPrice: String(price), totalAmount: String(amt), balanceQty: newBalance } as any }),
        this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '入库', materialName: line.materialName || order.materialName, quantity: String(qty), unitPrice: String(price), totalAmount: String(amt), transactionDate: new Date() } as any }),
      );
    }

    operations.push(
      this.prisma.inboundOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'RECEIVED' } as any }),
    );

    // Phase 2: execute in single transaction — all or nothing
    await this.prisma.$transaction(operations);

    return this.prisma.inboundOrder.findUniqueOrThrow({ where: { id } });
  }

  @Put(':id/cancel-approve')
  async cancelApprove(@Param('id') id: string) {
    const order = await this.prisma.inboundOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    if (order.approvalStatus !== 'APPROVED' && order.businessStatus !== 'RECEIVED') {
      throw new BadRequestException('只能撤销已登卡的入库单');
    }

    const tenantId = await this.tid();
    const operations: any[] = [];

    for (const line of order.lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || '').trim();
      const qty = Number(line.quantity || 0);

      if (!matCode || !whCode || qty <= 0) continue;

      const existing = await this.prisma.inventory.findFirst({ where: {
        tenantId, materialCode: matCode, warehouseCode: whCode,
        locationCode: line.locationCode || '', batchNo: line.batchNo || '',
        qualityStatus: 'QUALIFIED', projectCode: '',
      } as any });

      if (!existing || Number(existing.quantity || 0) < qty) {
        throw new BadRequestException(`撤销登卡失败：${matCode} 库存不足 (当前${existing ? Number(existing.quantity) : 0}，需要${qty})`);
      }

      const newQty = String(Math.max(0, (Number(existing.quantity) || 0) - qty));
      const newAvail = String(Math.max(0, (Number(existing.availableQty) || 0) - qty));

      operations.push(
        this.prisma.inventory.update({
          where: { id: existing.id },
          data: { quantity: newQty, availableQty: newAvail },
        }),
        this.prisma.inventoryTransaction.create({ data: {
          tenantId, transactionNo: order.orderNo, transactionType: 'IN_CANCEL',
          sourceType: 'inbound_order', sourceNo: order.orderNo,
          sourceLineNo: line.lineNo ?? 1,
          materialCode: matCode, materialName: line.materialName || order.materialName,
          spec: line.spec || order.specification, unit: line.unit,
          warehouseCode: whCode, locationCode: line.locationCode || '', batchNo: line.batchNo || '',
          qualityStatus: 'QUALIFIED',
          quantity: String(-qty), unitPrice: '0',
          totalAmount: '0', balanceQty: newQty,
        } as any }),
        this.prisma.costLedger.create({ data: {
          tenantId, transactionNo: order.orderNo + '-CX', transactionType: '入库撤销',
          materialName: line.materialName || order.materialName,
          quantity: String(-qty), unitPrice: '0', totalAmount: '0',
          transactionDate: new Date(),
        } as any }),
      );
    }

    operations.push(
      this.prisma.inboundOrder.update({
        where: { id },
        data: { approvalStatus: 'SUBMITTED', businessStatus: 'PENDING' } as any,
      }),
    );

    await this.prisma.$transaction(operations);

    return this.prisma.inboundOrder.findUniqueOrThrow({ where: { id } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.inboundOrderLine.deleteMany({ where: { inboundOrderId: id } });
    await this.prisma.inboundOrder.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
