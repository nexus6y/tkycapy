import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";
import { pickAllowed } from "../common/dto-normalizer";

const ISS_KEYS = ['orderNo','productionOrderId','productionOrderNo','materialId','materialName','spec','quantity','departmentId','departmentName','issueDate','approvalStatus','businessStatus','remark','tenantId'];
function cleanIss(dto: any): any { const d = pickAllowed(dto, ISS_KEYS); for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }; if (d.issueDate) d.issueDate = new Date(d.issueDate); if (d.quantity != null) d.quantity = String(d.quantity); return d; }

@Controller("issue-orders")
export class IssueOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get()
  async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.issueOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.issueOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.prisma.issueOrder.findUniqueOrThrow({ where: { id }, include: { lines: { orderBy: { lineNo: 'asc' } } } });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('ISS', 'issueOrder', 'orderNo');
    const { lines, ...orderData } = dto;
    const clean = { ...cleanIss(orderData), tenantId };
    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.issueOrder.create({
        data: {
          ...clean,
          lines: { create: lines.map((l: any, i: number) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            warehouseCode: l.warehouseCode,
          })) },
        },
        include: { lines: true },
      });
    }
    return this.prisma.issueOrder.create({ data: clean });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    const { lines, ...orderData } = dto;
    const clean = cleanIss(orderData);
    if (lines !== undefined) {
      await this.prisma.issueOrderLine.deleteMany({ where: { issueOrderId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.issueOrderLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, issueOrderId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }
    return this.prisma.issueOrder.update({ where: { id }, data: clean, include: { lines: { orderBy: { lineNo: 'asc' } } } });
  }

  @Put(":id/submit")
  async submit(@Param("id") id: string) {
    return this.prisma.issueOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any });
  }

  @Put(":id/approve")
  async approve(@Param("id") id: string) {
    const order = await this.prisma.issueOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
    if (order.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能审批已提交的领料单');
    const tenantId = await this.tid();

    // Fallback to single-line if no lines
    const lines = order.lines && order.lines.length > 0 ? order.lines : [{
      materialCode: null, materialName: order.materialName, spec: order.spec,
      unit: null, quantity: order.quantity, warehouseCode: null,
    } as any];

    const operations: any[] = [];

    for (const line of lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || '').trim();
      const qty = Number(line.quantity || 0);

      if (!matCode) throw new BadRequestException(`领料登卡失败：明细行缺少物料编码`);
      if (!whCode) throw new BadRequestException(`领料登卡失败：明细行缺少仓库编码 (物料 ${matCode})`);
      if (qty <= 0) continue;

      let existing = await this.prisma.inventory.findFirst({ where: {
        tenantId, materialCode: matCode, warehouseCode: whCode,
        locationCode: '', batchNo: '',
        qualityStatus: 'QUALIFIED', projectCode: '',
      } as any });

      if (!existing) {
        existing = await this.prisma.inventory.findFirst({ where: {
          tenantId, materialCode: matCode, warehouseCode: whCode,
          qualityStatus: 'QUALIFIED',
        } as any });
      }

      if (!existing || Number(existing.availableQty || 0) < qty) {
        throw new BadRequestException(`领料登卡失败：${matCode} 库存不足 (可用${existing ? Number(existing.availableQty) : 0}，需要${qty})`);
      }

      // Cost from ledger
      const allInbound = await this.prisma.costLedger.findMany({
        where: { materialName: line.materialName || order.materialName, transactionType: '入库' },
        orderBy: { createdAt: 'desc' },
      });
      let unitCost = 0;
      if (allInbound.length > 0) {
        const tQ = allInbound.reduce((s, e) => s + Number(e.quantity || 0), 0);
        const tA = allInbound.reduce((s, e) => s + Number(e.totalAmount || 0), 0);
        unitCost = tQ > 0 ? tA / tQ : 0;
      }
      const outAmount = qty * unitCost;
      const newAvail = String(Math.max(0, (Number(existing.quantity || 0)) - qty));
      const newQty = String(Math.max(0, (Number(existing.quantity || 0)) - qty));

      operations.push(
        this.prisma.inventory.update({ where: { id: existing.id }, data: { quantity: newQty, availableQty: newAvail } }),
        this.prisma.inventoryTransaction.create({ data: {
          tenantId, transactionNo: order.orderNo, transactionType: 'PRODUCTION_ISSUE',
          sourceType: 'issue_order', sourceNo: order.orderNo,
          sourceLineNo: line.lineNo ?? 1,
          materialCode: matCode, materialName: line.materialName || order.materialName,
          spec: line.spec || order.spec, unit: line.unit,
          warehouseCode: whCode, locationCode: '', batchNo: '',
          qualityStatus: 'QUALIFIED',
          quantity: String(-qty), unitPrice: String(unitCost),
          totalAmount: String(outAmount), balanceQty: newAvail,
        } as any }),
        this.prisma.costLedger.create({ data: {
          tenantId, transactionNo: order.orderNo, transactionType: '领料出库',
          materialName: line.materialName || order.materialName,
          quantity: String(qty), unitPrice: String(unitCost),
          totalAmount: String(outAmount), transactionDate: new Date(),
        } as any }),
      );
    }

    operations.push(
      this.prisma.issueOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'ISSUED' } as any }),
    );

    // Update ProductionMaterialLine.issuedQty for each line
    if (order.productionOrderId) {
      for (const line of lines) {
        const matCode = (line.materialCode || '').trim();
        const qty = Number(line.quantity || 0);
        if (!matCode || qty <= 0) continue;
        // Find matching production material line by materialCode + warehouseCode
        const pmlWhere: any = {
          productionOrderId: order.productionOrderId,
          materialCode: matCode,
        };
        const whCode = (line.warehouseCode || '').trim();
        if (whCode) pmlWhere.warehouseCode = whCode;
        const pml = await this.prisma.productionMaterialLine.findFirst({ where: pmlWhere });
        if (pml) {
          const newIssued = String(Number(pml.issuedQty || 0) + qty);
          operations.push(
            this.prisma.productionMaterialLine.update({
              where: { id: pml.id },
              data: { issuedQty: newIssued } as any,
            }),
          );
        }
      }
    }

    // Transition production order: PENDING_ISSUE or ISSUING → IN_PRODUCTION
    if (order.productionOrderId) {
      operations.push(
        this.prisma.productionOrder.updateMany({
          where: { id: order.productionOrderId, businessStatus: { in: ['PENDING_ISSUE', 'ISSUING'] } },
          data: { businessStatus: 'IN_PRODUCTION' } as any,
        }),
      );
    }

    await this.prisma.$transaction(operations);
    return this.prisma.issueOrder.findUniqueOrThrow({ where: { id } });
  }

  @Put(":id/cancel-approve")
  async cancelApprove(@Param("id") id: string) {
    const order = await this.prisma.issueOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
    if (order.approvalStatus !== 'APPROVED') throw new BadRequestException('只能撤销已登卡的领料单');
    const tenantId = await this.tid();
    const lines = order.lines && order.lines.length > 0 ? order.lines : [];
    const operations: any[] = [];

    for (const line of lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || '').trim();
      const qty = Number(line.quantity || 0);
      if (!matCode || !whCode || qty <= 0) continue;

      let existing = await this.prisma.inventory.findFirst({ where: {
        tenantId, materialCode: matCode, warehouseCode: whCode,
        locationCode: '', batchNo: '',
        qualityStatus: 'QUALIFIED', projectCode: '',
      } as any });
      if (!existing) {
        existing = await this.prisma.inventory.findFirst({ where: {
          tenantId, materialCode: matCode, warehouseCode: whCode, qualityStatus: 'QUALIFIED',
        } as any });
      }

      const newQty = String((Number(existing?.quantity || 0)) + qty);
      const newAvail = String((Number(existing?.availableQty || 0)) + qty);

      operations.push(
        this.prisma.inventory.upsert({
          where: { id: existing?.id || 'will-create' },
          update: { quantity: newQty, availableQty: newAvail },
          create: { tenantId, materialCode: matCode, materialName: line.materialName || order.materialName, spec: line.spec || order.spec, unit: line.unit, warehouseCode: whCode, locationCode: '', batchNo: '', qualityStatus: 'QUALIFIED', projectCode: '', quantity: String(qty), availableQty: String(qty), lockedQty: '0' } as any,
        }),
        this.prisma.inventoryTransaction.create({ data: {
          tenantId, transactionNo: order.orderNo, transactionType: 'ISSUE_CANCEL',
          sourceType: 'issue_order', sourceNo: order.orderNo,
          sourceLineNo: line.lineNo ?? 1,
          materialCode: matCode, materialName: line.materialName || order.materialName,
          spec: line.spec || order.spec, unit: line.unit,
          warehouseCode: whCode, locationCode: '', batchNo: '',
          qualityStatus: 'QUALIFIED',
          quantity: String(qty), unitPrice: '0', totalAmount: '0', balanceQty: newAvail,
        } as any }),
        this.prisma.costLedger.create({ data: {
          tenantId, transactionNo: order.orderNo + '-CX', transactionType: '领料撤销',
          materialName: line.materialName || order.materialName,
          quantity: String(-qty), unitPrice: '0', totalAmount: '0', transactionDate: new Date(),
        } as any }),
      );
    }

    operations.push(
      this.prisma.issueOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED', businessStatus: 'PENDING' } as any }),
    );

    // Decrement ProductionMaterialLine.issuedQty for each line
    if (order.productionOrderId) {
      for (const line of lines) {
        const matCode = (line.materialCode || '').trim();
        const qty = Number(line.quantity || 0);
        if (!matCode || qty <= 0) continue;
        const pmlWhere: any = {
          productionOrderId: order.productionOrderId,
          materialCode: matCode,
        };
        const whCode = (line.warehouseCode || '').trim();
        if (whCode) pmlWhere.warehouseCode = whCode;
        const pml = await this.prisma.productionMaterialLine.findFirst({ where: pmlWhere });
        if (pml) {
          const newIssued = String(Math.max(0, Number(pml.issuedQty || 0) - qty));
          operations.push(
            this.prisma.productionMaterialLine.update({
              where: { id: pml.id },
              data: { issuedQty: newIssued } as any,
            }),
          );
        }
      }
    }

    // Transition production order back: IN_PRODUCTION → ISSUING
    if (order.productionOrderId) {
      operations.push(
        this.prisma.productionOrder.updateMany({
          where: { id: order.productionOrderId, businessStatus: 'IN_PRODUCTION' },
          data: { businessStatus: 'ISSUING' } as any,
        }),
      );
    }

    await this.prisma.$transaction(operations);
    return this.prisma.issueOrder.findUniqueOrThrow({ where: { id } });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.issueOrderLine.deleteMany({ where: { issueOrderId: id } });
    await this.prisma.issueOrder.delete({ where: { id } });
    return { message: "删除成功" };
  }
}
