import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { pickAllowed } from '../common/dto-normalizer';
import { guardSubmit } from '../common/business-rules.helper';

const OUT_KEYS = ['orderNo','sourceType','sourceNo','materialName','specification','quantity','warehouseId','warehouseName','unitPrice','totalAmount','approvalStatus','businessStatus','shipmentDate','remark','tenantId'];

function clean(dto: any): any {
  const d = pickAllowed(dto, OUT_KEYS);
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }
  return d;
}

@Controller('outbound-orders')
export class OutboundOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([
      this.prisma.outboundOrder.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.outboundOrder.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.outboundOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const lines = Array.isArray(dto.lines) ? dto.lines : null;
    const data = clean(dto);
    data.tenantId = tenantId;
    if (!data.orderNo) data.orderNo = await this.codeGen.generate('OUT', 'outboundOrder', 'orderNo');
    if (data.shipmentDate) data.shipmentDate = new Date(data.shipmentDate);
    ['quantity','unitPrice','totalAmount'].forEach(f => {
      if (data[f] != null) data[f] = String(data[f]);
    });

    try {
      if (lines && Array.isArray(lines) && lines.length > 0) {
        return await this.prisma.outboundOrder.create({
          data: {
            ...data,
            lines: { create: lines.map((l: any, i: number) => ({
              tenantId, lineNo: l.lineNo ?? i + 1,
              materialCode: l.materialCode, materialName: l.materialName,
              spec: l.spec, unit: l.unit,
              quantity: l.quantity != null ? String(l.quantity) : null,
              unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
              amount: l.amount != null ? String(l.amount) : null,
              warehouseCode: l.warehouseCode, locationCode: l.locationCode, batchNo: l.batchNo,
            })) },
          } as any,
          include: { lines: true },
        });
      }
      return await this.prisma.outboundOrder.create({ data } as any);
    } catch (e: any) {
      if (e.code === 'P2002') throw new HttpException('出库单号已存在', HttpStatus.BAD_REQUEST);
      throw e;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...rawData } = dto;
    const orderData = clean(rawData);
    if (orderData.shipmentDate) orderData.shipmentDate = new Date(orderData.shipmentDate);
    ['quantity','unitPrice','totalAmount'].forEach(f => {
      if (orderData[f] != null) orderData[f] = String(orderData[f]);
    });

    if (lines !== undefined) {
      await this.prisma.outboundOrderLine.deleteMany({ where: { outboundOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.outboundOrderLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, outboundOrderId: id, lineNo: l.lineNo ?? i + 1,
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
    return this.prisma.outboundOrder.update({
      where: { id }, data: orderData as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'outboundOrder', id);
    return this.prisma.outboundOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const order = await this.prisma.outboundOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
    if (order.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能审批已提交的出库单');

    const lines = order.lines && order.lines.length > 0 ? order.lines : [{
      materialCode: null, materialName: order.materialName, spec: order.specification,
      unit: null, quantity: order.quantity, unitPrice: order.unitPrice,
      amount: order.totalAmount, warehouseCode: order.warehouseName || order.warehouseId,
      locationCode: null, batchNo: null,
    } as any];

    // Phase 0: resolve missing warehouseCodes
    const tenantId = await this.tid();
    const noWhLines = lines.filter((l: any) => !(l.warehouseCode || '').trim());
    if (noWhLines.length > 0) {
      const matCodes = [...new Set(noWhLines.map((l: any) => (l.materialCode || '').trim()).filter(Boolean))] as string[];
      const matWhMap = new Map<string, string>();
      if (matCodes.length > 0) {
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

    let totalAmt = 0;
    const operations: any[] = [];

    // Phase 1: validate ALL lines + find inventory
    for (const line of lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || '').trim();
      const qty = Number(line.quantity || 0);

      if (!matCode) throw new BadRequestException(`出库登卡失败：明细行缺少物料编码 (${line.materialName || '未知物料'})`);
      if (!whCode) throw new BadRequestException(`出库登卡失败：明细行缺少仓库编码 (物料 ${matCode})`);
      if (qty <= 0) throw new BadRequestException(`出库登卡失败：明细行数量必须大于0 (物料 ${matCode})`);

      let existing = await this.prisma.inventory.findFirst({ where: {
        tenantId, materialCode: matCode, warehouseCode: whCode,
        locationCode: line.locationCode || '',
        batchNo: line.batchNo || '',
        qualityStatus: 'QUALIFIED', projectCode: '',
      } as any });

      if (!existing) {
        existing = await this.prisma.inventory.findFirst({ where: {
          tenantId, materialCode: matCode, warehouseCode: whCode,
          locationCode: line.locationCode || '',
          batchNo: line.batchNo || '',
          qualityStatus: 'QUALIFIED', projectCode: null,
        } as any });
      }

      if (!existing || Number(existing.availableQty || 0) < qty) {
        throw new BadRequestException(`库存不足: ${line.materialName || matCode}, 可用${existing ? Number(existing.availableQty) : 0}, 需要${qty}`);
      }

      const newQty = String(Math.max(0, (Number(existing.quantity) || 0) - qty));
      const newAvail = String(Math.max(0, (Number(existing.availableQty) || 0) - qty));

      const allInbound = await this.prisma.costLedger.findMany({
        where: { materialName: line.materialName || order.materialName, transactionType: '入库' },
        orderBy: { createdAt: 'desc' },
      });
      let unitCost = Number(line.unitPrice || order.unitPrice || 0);
      if (!unitCost && allInbound.length > 0) {
        const tQ = allInbound.reduce((s, e) => s + Number(e.quantity || 0), 0);
        const tA = allInbound.reduce((s, e) => s + Number(e.totalAmount || 0), 0);
        unitCost = tQ > 0 ? tA / tQ : 0;
      }
      const outAmount = qty * unitCost;
      totalAmt += outAmount;

      // Add writes for this line (will run in $transaction)
      operations.push(
        this.prisma.inventory.update({ where: { id: existing!.id }, data: { quantity: newQty, availableQty: newAvail } }),
        this.prisma.inventoryTransaction.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: 'OUT', sourceType: 'outbound_order', sourceNo: order.orderNo, sourceLineNo: line.lineNo ?? 1, materialCode: matCode, materialName: line.materialName || order.materialName, spec: line.spec || order.specification, unit: line.unit, warehouseCode: whCode, locationCode: line.locationCode || '', batchNo: line.batchNo || '', qualityStatus: 'QUALIFIED', quantity: String(-qty), unitPrice: String(unitCost), totalAmount: String(outAmount), balanceQty: newAvail } as any }),
        this.prisma.costLedger.create({ data: { tenantId, transactionNo: order.orderNo, transactionType: '出库', materialName: line.materialName || order.materialName, quantity: String(qty), unitPrice: String(unitCost), totalAmount: String(outAmount), transactionDate: new Date() } as any }),
      );
    }

    operations.push(
      this.prisma.outboundOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'SHIPPED', totalAmount: String(totalAmt) } as any }),
    );

    // Phase 2: execute in single transaction — all or nothing
    await this.prisma.$transaction(operations);

    return this.prisma.outboundOrder.findUniqueOrThrow({ where: { id } });
  }

  @Put(':id/cancel-approve')
  async cancelApprove(@Param('id') id: string) {
    const order = await this.prisma.outboundOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    if (order.approvalStatus !== 'APPROVED' && order.businessStatus !== 'SHIPPED') {
      throw new BadRequestException('只能撤销已登卡的出库单');
    }

    const tenantId = await this.tid();
    const operations: any[] = [];

    for (const line of order.lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || '').trim();
      const qty = Number(line.quantity || 0);

      if (!matCode || !whCode || qty <= 0) continue;

      let existing = await this.prisma.inventory.findFirst({ where: {
        tenantId, materialCode: matCode, warehouseCode: whCode,
        locationCode: line.locationCode || '', batchNo: line.batchNo || '',
        qualityStatus: 'QUALIFIED', projectCode: '',
      } as any });

      if (!existing) {
        existing = await this.prisma.inventory.findFirst({ where: {
          tenantId, materialCode: matCode, warehouseCode: whCode,
          locationCode: line.locationCode || '', batchNo: line.batchNo || '',
          qualityStatus: 'QUALIFIED', projectCode: null,
        } as any });
      }

      const newQty = String((Number(existing?.quantity || 0)) + qty);
      const newAvail = String((Number(existing?.availableQty || 0)) + qty);

      operations.push(
        this.prisma.inventory.upsert({
          where: { id: existing?.id || 'will-create' },
          update: { quantity: newQty, availableQty: newAvail },
          create: {
            tenantId, materialCode: matCode, materialName: line.materialName || order.materialName,
            spec: line.spec || order.specification, unit: line.unit,
            warehouseCode: whCode, locationCode: line.locationCode || '',
            batchNo: line.batchNo || '', qualityStatus: 'QUALIFIED', projectCode: '',
            quantity: String(qty), availableQty: String(qty), lockedQty: '0',
          } as any,
        }),
        this.prisma.inventoryTransaction.create({ data: {
          tenantId, transactionNo: order.orderNo, transactionType: 'OUT_CANCEL',
          sourceType: 'outbound_order', sourceNo: order.orderNo,
          sourceLineNo: line.lineNo ?? 1,
          materialCode: matCode, materialName: line.materialName || order.materialName,
          spec: line.spec || order.specification, unit: line.unit,
          warehouseCode: whCode, locationCode: line.locationCode || '', batchNo: line.batchNo || '',
          qualityStatus: 'QUALIFIED',
          quantity: String(qty), unitPrice: '0',
          totalAmount: '0', balanceQty: newAvail,
        } as any }),
        this.prisma.costLedger.create({ data: {
          tenantId, transactionNo: order.orderNo + '-CX', transactionType: '出库撤销',
          materialName: line.materialName || order.materialName,
          quantity: String(-qty), unitPrice: '0', totalAmount: '0',
          transactionDate: new Date(),
        } as any }),
      );
    }

    operations.push(
      this.prisma.outboundOrder.update({
        where: { id },
        data: { approvalStatus: 'SUBMITTED', businessStatus: 'PENDING' } as any,
      }),
    );

    await this.prisma.$transaction(operations);

    return this.prisma.outboundOrder.findUniqueOrThrow({ where: { id } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.outboundOrderLine.deleteMany({ where: { outboundOrderId: id } });
    await this.prisma.outboundOrder.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
