import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
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
    if (!data.orderNo) {
      data.orderNo = await this.codeGen.generate('PO', 'purchaseOrder', 'orderNo');
    }
    if (data.expectedDeliveryDate) data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (data.totalAmount != null && data.totalAmount !== '') data.totalAmount = String(data.totalAmount);
    else delete data.totalAmount;

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

    if (lines !== undefined) {
      await this.prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
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

    const tenantId = await this.tid();
    const orderWithLines = await this.prisma.purchaseOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    // Determine whether materials need inspection
    const materialCodes = [...new Set(
      (orderWithLines.lines || []).map(l => l.materialCode).filter(Boolean)
    )];
    let needsInspection = false;
    if (materialCodes.length > 0) {
      const materials = await this.prisma.material.findMany({
        where: { code: { in: materialCodes as string[] }, tenantId },
      });
      needsInspection = materials.some(m => m.needInspection);
    }

    // Only create Inspection when at least one material needs inspection
    if (needsInspection && orderWithLines.lines && orderWithLines.lines.length > 0) {
      const insNo = await this.codeGen.generate('INS', 'inspection', 'inspectionNo');
      const totalQty = orderWithLines.lines.reduce((s, l) => s + Number(l.quantity || 0), 0);

      await this.prisma.inspection.create({
        data: {
          tenantId,
          inspectionNo: insNo,
          sourceType: 'PURCHASE_ORDER',
          sourceNo: order.orderNo,
          materialName: order.orderName,
          quantity: String(totalQty),
          qualifiedQty: '0',
          unqualifiedQty: '0',
          approvalStatus: 'DRAFT',
          businessStatus: 'PENDING',
          lines: {
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
          },
        } as any,
      });
    }

    return order;
  }

  // Push-down: confirm arrival → generate inbound order (idempotent)
  // Only allowed when no Inspection was created (materials don't need inspection)
  @Post(':id/confirm-arrival')
  async confirmArrival(@Param('id') id: string) {
    const tenantId = await this.tid();
    return await this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUniqueOrThrow({
        where: { id },
        include: { lines: { orderBy: { lineNo: 'asc' } } },
      });

      if (po.approvalStatus !== 'APPROVED') throw new BadRequestException('只能从已审批的采购订单确认到货');
      if (!po.lines || po.lines.length === 0) throw new BadRequestException('采购订单没有明细行');

      // Check material needInspection — if any material needs inspection, block direct arrival
      const materialCodes = [...new Set(
        po.lines.map(l => l.materialCode).filter(Boolean)
      )];
      if (materialCodes.length > 0) {
        const materials = await tx.material.findMany({
          where: { code: { in: materialCodes as string[] }, tenantId },
        });
        if (materials.some(m => m.needInspection)) {
          throw new BadRequestException('采购订单包含需质检物料，请通过质检流程入库');
        }
      }

      // Idempotency guard: reject if any inbound already exists for this PO
      const anyInbound = await tx.inboundOrder.findFirst({
        where: { sourceNo: po.orderNo, sourceType: { in: ['ARRIVAL_CONFIRM', 'INSPECTION'] } },
      });
      if (anyInbound) throw new BadRequestException(`该采购订单已生成入库单 ${anyInbound.orderNo}（来源：${anyInbound.sourceType}），不能重复生成`);

      const inNo = await this.codeGen.generate('IN', 'inboundOrder', 'orderNo');
      const totalAmt = po.lines.reduce((s, l) => {
        const amt = num(l.amount) > 0 ? num(l.amount) : (num(l.quantity) * num(l.unitPrice));
        return s + amt;
      }, 0);
      const totalQty = String(po.lines.reduce((s, l) => s + num(l.quantity), 0));

      await tx.inboundOrder.create({
        data: {
          tenantId, orderNo: inNo,
          sourceType: 'ARRIVAL_CONFIRM', sourceNo: po.orderNo,
          supplierId: po.supplierId, supplierName: po.supplierName,
          materialName: po.orderName,
          quantity: totalQty, qualifiedQty: totalQty,
          unitPrice: totalAmt > 0 ? String(totalAmt / num(totalQty)) : null,
          totalAmount: String(totalAmt),
          receiptDate: new Date(), approvalStatus: 'DRAFT', businessStatus: 'PENDING',
          lines: { create: po.lines.map((l, i) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode || '', materialName: l.materialName || '',
            spec: l.spec || '', unit: l.unit || '',
            quantity: l.quantity != null ? String(l.quantity) : '0',
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : null,
            amount: l.amount != null ? String(l.amount) : null,
            warehouseCode: l.warehouseCode || '',
          })) },
        } as any,
      });

      return { message: '到货确认成功，入库单已生成', inboundOrderNo: inNo };
    });
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

function num(v: any): number { try { return Number(v) || 0 } catch { return 0 } }
