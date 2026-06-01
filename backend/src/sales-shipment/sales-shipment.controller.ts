import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { guardSubmit, guardApprove } from '../common/business-rules.helper';
import { CodeGeneratorService } from '../common/code-generator.service';

@Controller('sales-shipments')
export class SalesShipmentController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.shipmentNo = { contains: code }; if (name) where.customerName = { contains: name };
    const [items, total] = await Promise.all([this.prisma.salesShipment.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.salesShipment.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const shipment = await this.prisma.salesShipment.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    // Enrich shipment lines with unitPrice/amount from the linked sales order
    if (shipment.orderId && shipment.lines && shipment.lines.length > 0) {
      const so = await this.prisma.salesOrder.findUnique({
        where: { id: shipment.orderId },
        include: { lines: { orderBy: { lineNo: 'asc' } } },
      });
      if (so && so.lines) {
        const soLineMap = new Map(so.lines.map(l => [l.id, l]));
        for (const sl of shipment.lines as any[]) {
          if (sl.salesOrderLineId) {
            const sol = soLineMap.get(sl.salesOrderLineId);
            if (sol) {
              const shipRatio = Number(sl.shippedQty || 0) / Math.max(1, Number(sol.quantity || 0));
              sl.unitPrice = sol.unitPrice || '0';
              sl.amount = String((Number(sol.amount || 0) * shipRatio).toFixed(2));
            }
          }
        }
      }
    }

    return shipment;
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    if (!dto.shipmentNo) dto.shipmentNo = await this.codeGen.generate('SHIP', 'salesShipment', 'shipmentNo');

    // Pre-fetch SO lines for unitPrice/amount if orderId is provided
    let soLineMap = new Map<string, any>();
    if (dto.orderId) {
      const so = await this.prisma.salesOrder.findUnique({
        where: { id: dto.orderId },
        include: { lines: true },
      });
      if (so && so.lines) {
        soLineMap = new Map(so.lines.map(l => [l.id, l]));
      }
    }

    const { lines, ...shipData } = dto;
    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.salesShipment.create({
        data: {
          ...shipData, tenantId,
          lines: { create: lines.map((l: any, i: number) => {
            const solId = l.salesOrderLineId || l.id || null;
            const sol = solId ? soLineMap.get(solId) : null;
            return {
              tenantId, lineNo: l.lineNo ?? i + 1,
              salesOrderLineId: solId,
              materialCode: l.materialCode, materialName: l.materialName,
              spec: l.spec, unit: l.unit,
              orderQty: l.orderQty != null ? String(l.orderQty) : null,
              shippedQty: l.shippedQty != null ? String(l.shippedQty) : null,
              unitPrice: sol?.unitPrice != null ? String(sol.unitPrice) : null,
              amount: sol != null ? String((Number(sol.amount || 0) * (Number(l.shippedQty || 0) / Math.max(1, Number(sol.quantity || 0)))).toFixed(2)) : null,
              warehouseCode: l.warehouseCode,
            };
          }) },
        } as any,
        include: { lines: true },
      });
    }
    return this.prisma.salesShipment.create({ data: { ...shipData, tenantId } as any });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...shipData } = dto;
    if (lines !== undefined) {
      await this.prisma.salesShipmentLine.deleteMany({ where: { shipmentId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.salesShipmentLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, shipmentId: id, lineNo: l.lineNo ?? i + 1,
            salesOrderLineId: l.salesOrderLineId || null,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            orderQty: l.orderQty != null ? String(l.orderQty) : null,
            shippedQty: l.shippedQty != null ? String(l.shippedQty) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }
    return this.prisma.salesShipment.update({ where: { id }, data: shipData as any, include: { lines: { orderBy: { lineNo: 'asc' } } } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.salesShipmentLine.deleteMany({ where: { shipmentId: id } });
    await this.prisma.salesShipment.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    await guardSubmit(this.prisma, 'salesShipment', id);
    return this.prisma.salesShipment.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    await guardApprove(this.prisma, 'salesShipment', id);
    const tenantId = await this.tid();

    // Load shipment with lines (if user provided partial-shipment detail)
    const shipment = await this.prisma.salesShipment.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    if (!shipment.orderId) {
      throw new BadRequestException('发货单未关联销售订单，无法生成出库单');
    }

    // Load sales order with lines
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: shipment.orderId },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
    if (!so || !so.lines || so.lines.length === 0) {
      throw new BadRequestException('销售订单无明细行，无法生成出库单');
    }

    const shipLines = shipment.lines || [];

    // Calculate already-shipped from THIS order's prior outbounds.
    // Use salesOrderLineId (precise) or `${orderId}:${materialCode}` (legacy fallback) as key.
    const allOutboundLines = await this.prisma.outboundOrderLine.findMany({
      where: {
        tenantId,
        outboundOrder: { sourceType: 'SALES_SHIPMENT', sourceNo: { not: '' } },
      },
      include: { outboundOrder: true },
    });

    const orderShipments = await this.prisma.salesShipment.findMany({
      where: { tenantId, orderId: shipment.orderId },
    });
    const orderShipmentNos = new Set(orderShipments.map(s => s.shipmentNo));

    const shipped = new Map<string, number>();
    for (const ol of allOutboundLines) {
      if (!ol.outboundOrder?.sourceNo || !orderShipmentNos.has(ol.outboundOrder.sourceNo)) continue;
      let qty = Number(ol.quantity || 0);
      if (qty <= 0) continue;

      // Primary: salesOrderLineId
      if (ol.salesOrderLineId) {
        const key = ol.salesOrderLineId;
        shipped.set(key, (shipped.get(key) || 0) + qty);
      }

      // Fallback: `${orderId}:${materialCode}` — consistent read/write key
      const mcKey = `${shipment.orderId}:${ol.materialCode || ''}`;
      shipped.set(mcKey, (shipped.get(mcKey) || 0) + qty);
    }

    const shipmentQty = Number(shipment.totalQuantity || 0);
    const outboundLines: any[] = [];

    if (shipLines.length > 0) {
      for (const sl of shipLines) {
        const matCode = sl.materialCode || '';
        const soLineId = sl.salesOrderLineId || '';
        let soLine = so.lines.find(l => l.id === soLineId);
        if (!soLine) soLine = so.lines.find(l => (l.materialCode || '') === matCode);
        const soLineQty = soLine ? Number(soLine.quantity || 0) : 0;
        const soLineIdKey = soLine?.id || '';

        const alreadyShipped = (soLineIdKey ? shipped.get(soLineIdKey) : 0)
          || shipped.get(`${shipment.orderId}:${matCode}`) || 0;
        const remaining = Math.max(0, soLineQty - alreadyShipped);
        const shipQty = Number(sl.shippedQty || sl.orderQty || 0);

        if (shipQty <= 0) continue;
        if (shipQty > remaining) {
          throw new BadRequestException(`物料 ${matCode} 发货数量 ${shipQty} 超过可发量 ${remaining}（订单行${soLineQty}，已发${alreadyShipped}）`);
        }

        outboundLines.push({
          tenantId, lineNo: sl.lineNo,
          salesOrderLineId: soLine?.id || sl.salesOrderLineId || null,
          materialCode: matCode, materialName: sl.materialName || soLine?.materialName,
          spec: sl.spec || soLine?.spec, unit: sl.unit || soLine?.unit,
          quantity: String(shipQty),
          unitPrice: soLine?.unitPrice != null ? String(soLine.unitPrice) : null,
          amount: soLine?.amount != null ? String((Number(soLine.amount) / soLineQty) * shipQty) : null,
          warehouseCode: sl.warehouseCode || soLine?.warehouseCode || '',
          locationCode: '', batchNo: '',
        });
      }
    } else {
      // No shipment lines — allocate totalQuantity proportionally across SO lines
      let totalRemaining = 0;
      const remainingByLine: { soLine: any; remaining: number }[] = [];

      for (const sl of so.lines) {
        const soLineIdKey = sl.id || '';
        const matCode = sl.materialCode || '';
        const alreadyShipped = (soLineIdKey ? shipped.get(soLineIdKey) : 0)
          || shipped.get(`${shipment.orderId}:${matCode}`) || 0;
        const soQty = Number(sl.quantity || 0);
        const remaining = Math.max(0, soQty - alreadyShipped);
        totalRemaining += remaining;
        remainingByLine.push({ soLine: sl, remaining });
      }

      if (totalRemaining <= 0) {
        throw new BadRequestException('该销售订单所有物料已全部发货');
      }
      if (shipmentQty > totalRemaining) {
        throw new BadRequestException(`发货数量 ${shipmentQty} 超过可发总量 ${totalRemaining}`);
      }

      let allocatedRemaining = shipmentQty;
      for (let i = 0; i < remainingByLine.length; i++) {
        const { soLine, remaining } = remainingByLine[i];
        if (remaining <= 0) continue;

        const isLast = i === remainingByLine.length - 1 || allocatedRemaining <= remaining;
        const allocQty = isLast ? allocatedRemaining : Math.min(remaining, Math.ceil(shipmentQty * (remaining / totalRemaining)));

        if (allocQty <= 0) continue;
        allocatedRemaining -= allocQty;

        outboundLines.push({
          tenantId, lineNo: soLine.lineNo ?? i + 1,
          salesOrderLineId: soLine.id || null,
          materialCode: soLine.materialCode || '',
          materialName: soLine.materialName,
          spec: soLine.spec, unit: soLine.unit,
          quantity: String(allocQty),
          unitPrice: soLine.unitPrice != null ? String(soLine.unitPrice) : null,
          amount: soLine.unitPrice != null ? String(allocQty * Number(soLine.unitPrice)) : null,
          warehouseCode: soLine.warehouseCode || '',
          locationCode: '', batchNo: '',
        });
      }
    }

    if (outboundLines.length === 0) {
      throw new BadRequestException('没有可发货的物料');
    }

    const noWh = outboundLines.filter(l => !l.warehouseCode);
    if (noWh.length > 0) {
      const names = noWh.map(l => l.materialName || l.materialCode).join(', ');
      throw new BadRequestException(`以下物料未配置仓库: ${names}`);
    }

    const totalQty = outboundLines.reduce((s, l) => s + Number(l.quantity || 0), 0);
    const totalAmt = outboundLines.reduce((s, l) => s + Number(l.amount || 0), 0);
    const outNo = await this.codeGen.generate('OUT', 'outboundOrder', 'orderNo');

    // Interactive transaction: all writes run inside a single serialized callback.
    // Guards: ① enforce SUBMITTED→APPROVED with count check  ② idempotency by sourceType/sourceNo.
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.salesShipment.updateMany({
        where: { id, approvalStatus: 'SUBMITTED' },
        data: { approvalStatus: 'APPROVED' } as any,
      });

      if (result.count !== 1) {
        throw new BadRequestException('该发货单已被处理或状态不是已提交，请刷新后重试');
      }

      const existing = await tx.outboundOrder.findFirst({
        where: { sourceType: 'SALES_SHIPMENT', sourceNo: shipment.shipmentNo },
      });
      if (existing) {
        throw new BadRequestException(`该发货单已生成出库单 ${existing.orderNo}，不能重复生成`);
      }

      await tx.outboundOrder.create({
        data: {
          tenantId, orderNo: outNo,
          sourceType: 'SALES_SHIPMENT', sourceNo: shipment.shipmentNo,
          materialName: so.lines[0]?.materialName || shipment.customerName,
          quantity: String(totalQty), totalAmount: String(totalAmt),
          approvalStatus: 'DRAFT', businessStatus: 'PENDING',
          lines: { create: outboundLines },
        } as any,
      });

      if (shipment.orderId) {
        await tx.salesOrder.updateMany({
          where: { id: shipment.orderId, businessStatus: 'PENDING_SHIP' },
          data: { businessStatus: 'PARTIAL_SHIP' } as any,
        });
      }
    });

    return this.prisma.salesShipment.findUniqueOrThrow({ where: { id } });
  }
}
