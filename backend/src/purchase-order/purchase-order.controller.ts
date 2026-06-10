import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

/** Allowed PurchaseOrder fields — anything else is stripped to prevent Prisma unknown argument errors */
const PO_KEYS = new Set([
  'orderNo','orderName','supplierId','supplierName',
  'projectId','projectName','contractId','contractName',
  'departmentId','departmentName',
  'purchaseType','purchaser',
  'purchasePlanId','purchasePlanNo',
  'expectedDeliveryDate','totalAmount','remark',
  'approvalStatus','tenantId','createdBy',
]);

function cleanPurchaseOrderDto(raw: any): any {
  const data: any = {};
  for (const k of Object.keys(raw)) {
    if (PO_KEYS.has(k)) data[k] = raw[k];
  }
  // Normalize: empty strings → delete
  for (const k of Object.keys(data)) {
    if (data[k] === '' || data[k] === null) delete data[k];
  }
  // Map orderType → purchaseType
  if (!data.purchaseType && raw.orderType) data.purchaseType = raw.orderType;
  // Convert dates
  if (data.expectedDeliveryDate) data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
  // Convert decimals
  if (data.totalAmount != null) data.totalAmount = String(data.totalAmount);
  return data;
}

function handlePrismaError(e: any): never {
  if (e.code === 'P2002') throw new HttpException('唯一约束冲突，数据已存在', HttpStatus.BAD_REQUEST);
  if (e.code === 'P2003') throw new HttpException('外键约束：关联数据不存在', HttpStatus.BAD_REQUEST);
  if (e.code === 'P2025') throw new HttpException('记录未找到，可能已被删除', HttpStatus.NOT_FOUND);
  throw e;
}

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
    try {
      const tenantId = await this.tid();
      // Extract lines BEFORE cleaning so they don't get stripped by pickAllowed
      const rawLines = Array.isArray(dto.lines) ? dto.lines : null;
      const data = cleanPurchaseOrderDto(dto);
      data.tenantId = tenantId;
      if (!data.orderNo) {
        data.orderNo = await this.codeGen.generate('PO', 'purchaseOrder', 'orderNo');
      }

      if (rawLines && rawLines.length > 0) {
        return await this.prisma.purchaseOrder.create({
          data: {
            ...data,
            lines: {
              create: rawLines.map((l: any, i: number) => ({
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

      return await this.prisma.purchaseOrder.create({ data });
    } catch (e: any) { handlePrismaError(e); }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    try {
      const rawLines = Array.isArray(dto.lines) ? dto.lines : undefined;
      const data = cleanPurchaseOrderDto(dto);

      if (rawLines !== undefined) {
        await this.prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
        if (rawLines.length > 0) {
          const tenantId = await this.tid();
          await this.prisma.purchaseOrderLine.createMany({
            data: rawLines.map((l: any, i: number) => ({
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

      return await this.prisma.purchaseOrder.update({
        where: { id },
        data,
        include: { lines: { orderBy: { lineNo: 'asc' } } },
      });
    } catch (e: any) { handlePrismaError(e); }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const po = await this.prisma.purchaseOrder.findUniqueOrThrow({
      where: { id },
      select: { id: true, orderNo: true, approvalStatus: true },
    });

    // Only DRAFT or REJECTED can be deleted
    if (po.approvalStatus !== 'DRAFT' && po.approvalStatus !== 'REJECTED') {
      throw new BadRequestException('只有草稿或已拒绝状态的采购订单可以删除');
    }

    const tenantId = await this.tid();

    // Check for downstream references
    const [inspectionCount, inboundCount, returnCount] = await Promise.all([
      this.prisma.inspection.count({
        where: { tenantId, sourceType: 'PURCHASE_ORDER', sourceNo: po.orderNo },
      }),
      this.prisma.inboundOrder.count({
        where: { tenantId, sourceNo: po.orderNo },
      }),
      this.prisma.purchaseReturn.count({
        where: { tenantId, OR: [{ purchaseOrderId: id }, { purchaseOrderNo: po.orderNo }] },
      }),
    ]);

    if (inspectionCount + inboundCount + returnCount > 0) {
      const refs: string[] = [];
      if (inspectionCount > 0) refs.push('质检单');
      if (inboundCount > 0) refs.push('入库单');
      if (returnCount > 0) refs.push('退供单');
      throw new BadRequestException(`采购订单已被后续单据引用（${refs.join('、')}），不可删除`);
    }

    // Delete in transaction: lines first, then header
    await this.prisma.$transaction([
      this.prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } }),
      this.prisma.purchaseOrder.delete({ where: { id } }),
    ]);

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

      // Mark PO as in inspection pipeline — blocks direct arrival confirm
      await this.prisma.purchaseOrder.update({
        where: { id },
        data: { businessStatus: 'INSPECTING' } as any,
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

      // Idempotency guard: reject if any inbound already exists for this PO (manual, inspection, etc)
      const anyInbound = await tx.inboundOrder.findFirst({
        where: { sourceNo: po.orderNo, sourceType: { in: ['ARRIVAL_CONFIRM', 'INSPECTION', 'PURCHASE'] } },
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

      // Update PO businessStatus & line receivedQty
      await tx.purchaseOrder.update({
        where: { id },
        data: { businessStatus: 'FULLY_RECEIVED' } as any,
      });
      for (const l of po.lines) {
        await tx.purchaseOrderLine.update({
          where: { id: l.id },
          data: { receivedQty: l.quantity != null ? String(l.quantity) : '0' },
        });
      }

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
