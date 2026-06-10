import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";
import { pickAllowed } from "../common/dto-normalizer";

const RPT_KEYS = ['reportNo','sourceType','productionOrderId','productionOrderNo','materialCode','materialName','spec','unit','plannedQty','actualQty','deptName','warehouseCode','approvalStatus','businessStatus','remark','tenantId'];

function clean(dto: any): any {
  const d = pickAllowed(dto, RPT_KEYS);
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }
  return d;
}

@Controller("complete-reports")
export class CompleteReportController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get()
  async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.reportNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.completeReport.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.completeReport.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.prisma.completeReport.findUniqueOrThrow({ where: { id }, include: { lines: { orderBy: { lineNo: 'asc' } } } });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const { lines, ...rawData } = dto;
    const orderData = clean(rawData);
    orderData.tenantId = tenantId;
    if (!orderData.reportNo) orderData.reportNo = await this.codeGen.generate('RPT', 'completeReport', 'reportNo');
    try {
      if (lines && Array.isArray(lines) && lines.length > 0) {
        return await this.prisma.completeReport.create({
          data: {
            ...orderData,
            lines: { create: lines.map((l: any, i: number) => ({
              tenantId, lineNo: l.lineNo ?? i + 1,
              materialCode: l.materialCode, materialName: l.materialName,
              spec: l.spec, unit: l.unit,
              plannedQty: l.plannedQty != null ? String(l.plannedQty) : null,
              actualQty: l.actualQty != null ? String(l.actualQty) : null,
              warehouseCode: l.warehouseCode,
            })) },
          } as any,
          include: { lines: true },
        });
      }
      return await this.prisma.completeReport.create({ data: orderData as any });
    } catch (e: any) {
      if (e.code === 'P2002') throw new HttpException('完工报告号已存在', HttpStatus.BAD_REQUEST);
      throw e;
    }
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    const { lines, ...rawData } = dto;
    const orderData = clean(rawData);
    if (lines !== undefined) {
      await this.prisma.completeReportLine.deleteMany({ where: { reportId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.completeReportLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, reportId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            plannedQty: l.plannedQty != null ? String(l.plannedQty) : null,
            actualQty: l.actualQty != null ? String(l.actualQty) : null,
            warehouseCode: l.warehouseCode,
          })),
        });
      }
    }
    return this.prisma.completeReport.update({ where: { id }, data: orderData as any, include: { lines: { orderBy: { lineNo: 'asc' } } } });
  }

  @Put(":id/submit")
  async submit(@Param("id") id: string) {
    const order = await this.prisma.completeReport.findUniqueOrThrow({ where: { id } });
    if (order.approvalStatus !== 'DRAFT') throw new BadRequestException('只能提交草稿状态的完工报告');
    return this.prisma.completeReport.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(":id/approve")
  async approve(@Param("id") id: string) {
    const order = await this.prisma.completeReport.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
    if (order.approvalStatus !== 'SUBMITTED') {
      throw new BadRequestException(
        order.approvalStatus === 'APPROVED'
          ? '该完工报告已审批登卡，不能重复审批'
          : '只能审批已提交的完工报告'
      );
    }
    const tenantId = await this.tid();

    const lines = order.lines && order.lines.length > 0 ? order.lines : [{
      materialCode: order.materialCode, materialName: order.materialName,
      spec: order.spec, unit: order.unit,
      plannedQty: order.plannedQty, actualQty: order.actualQty,
      warehouseCode: null,
    } as any];

    // Quantity validation: actualQty must not exceed plannedQty per line
    for (const line of lines) {
      const actual = Number(line.actualQty || line.plannedQty || 0);
      const planned = Number(line.plannedQty || 0);
      if (actual > planned) {
        throw new BadRequestException(
          `完工登卡失败：物料 ${line.materialCode || line.materialName} 实际完工数量(${actual})超过计划数量(${planned})`
        );
      }
    }

    // If linked to a production order, validate total completed qty doesn't exceed order planned qty
    if (order.productionOrderId) {
      const prodOrder = await this.prisma.productionOrder.findUnique({
        where: { id: order.productionOrderId },
        include: { lines: true },
      });
      if (prodOrder && prodOrder.lines && prodOrder.lines.length > 0) {
        for (const line of lines) {
          const matCode = (line.materialCode || '').trim();
          const actual = Number(line.actualQty || line.plannedQty || 0);
          const poLine = prodOrder.lines.find(l => l.materialCode === matCode);
          if (poLine) {
            // Sum approved complete report qty for this material (excluding current report)
            const existingReports = await this.prisma.completeReportLine.findMany({
              where: {
                materialCode: matCode,
                report: { productionOrderId: order.productionOrderId, approvalStatus: 'APPROVED', id: { not: order.id } },
              },
            });
            const alreadyCompleted = existingReports.reduce((s, l) => s + Number(l.actualQty || l.plannedQty || 0), 0);
            const totalAfterThis = alreadyCompleted + actual;
            if (totalAfterThis > Number(poLine.plannedQty || 0)) {
              throw new BadRequestException(
                `完工登卡失败：物料 ${matCode} 累计完工数量(${totalAfterThis})超过生产订单计划数量(${poLine.plannedQty})`
              );
            }
          }
        }
      }
    }

    const operations: any[] = [];

    for (const line of lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || '').trim();
      const qty = Number(line.actualQty || line.plannedQty || 0);

      if (!matCode) throw new BadRequestException('完工登卡失败：明细行缺少物料编码');
      if (!whCode) throw new BadRequestException('完工登卡失败：明细行缺少仓库编码 (物料 ' + matCode + ')');
      if (qty <= 0) continue;

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
          tenantId, transactionNo: order.reportNo, transactionType: 'PRODUCTION_COMPLETE',
          sourceType: 'complete_report', sourceNo: order.reportNo,
          sourceLineNo: line.lineNo ?? 1,
          materialCode: matCode, materialName: line.materialName || order.materialName,
          spec: line.spec || order.spec, unit: line.unit,
          warehouseCode: whCode, locationCode: '', batchNo: '',
          qualityStatus: 'QUALIFIED',
          quantity: String(qty), unitPrice: '0', totalAmount: '0', balanceQty: newAvail,
        } as any }),
        this.prisma.costLedger.create({ data: {
          tenantId, transactionNo: order.reportNo, transactionType: '产品入库',
          materialName: line.materialName || order.materialName,
          quantity: String(qty), unitPrice: '0', totalAmount: '0', transactionDate: new Date(),
        } as any }),
      );
    }

    operations.push(
      this.prisma.completeReport.update({ where: { id }, data: { approvalStatus: 'APPROVED', businessStatus: 'COMPLETED' } as any }),
    );

    // Transition production order: IN_PRODUCTION → COMPLETED
    if (order.productionOrderId) {
      operations.push(
        this.prisma.productionOrder.updateMany({
          where: { id: order.productionOrderId, businessStatus: 'IN_PRODUCTION' },
          data: { businessStatus: 'COMPLETED' } as any,
        }),
      );
    }

    await this.prisma.$transaction(operations);
    return this.prisma.completeReport.findUniqueOrThrow({ where: { id } });
  }

  @Put(":id/cancel-approve")
  async cancelApprove(@Param("id") id: string) {
    const order = await this.prisma.completeReport.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
    if (order.approvalStatus !== 'APPROVED') throw new BadRequestException('只能撤销已完工登卡的完工报告');
    const tenantId = await this.tid();
    const lines = order.lines && order.lines.length > 0 ? order.lines : [{
      materialCode: order.materialCode, materialName: order.materialName,
      spec: order.spec, unit: order.unit,
      plannedQty: order.plannedQty, actualQty: order.actualQty,
      warehouseCode: null,
    } as any];
    const operations: any[] = [];

    for (const line of lines) {
      const matCode = (line.materialCode || '').trim();
      const whCode = (line.warehouseCode || '').trim();
      const qty = Number(line.actualQty || line.plannedQty || 0);
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

      if (!existing || Number(existing.quantity || 0) < qty) {
        throw new BadRequestException(`撤销完工失败：${matCode} 库存不足 (当前${existing ? Number(existing.quantity) : 0}，需要${qty})`);
      }

      const newQty = String(Math.max(0, (Number(existing.quantity || 0)) - qty));
      const newAvail = String(Math.max(0, (Number(existing.availableQty || 0)) - qty));

      operations.push(
        this.prisma.inventory.update({ where: { id: existing.id }, data: { quantity: newQty, availableQty: newAvail } }),
        this.prisma.inventoryTransaction.create({ data: {
          tenantId, transactionNo: order.reportNo, transactionType: 'COMPLETE_CANCEL',
          sourceType: 'complete_report', sourceNo: order.reportNo,
          sourceLineNo: line.lineNo ?? 1,
          materialCode: matCode, materialName: line.materialName || order.materialName,
          spec: line.spec || order.spec, unit: line.unit,
          warehouseCode: whCode, locationCode: '', batchNo: '',
          qualityStatus: 'QUALIFIED',
          quantity: String(-qty), unitPrice: '0', totalAmount: '0', balanceQty: newAvail,
        } as any }),
        this.prisma.costLedger.create({ data: {
          tenantId, transactionNo: order.reportNo + '-CX', transactionType: '完工撤销',
          materialName: line.materialName || order.materialName,
          quantity: String(-qty), unitPrice: '0', totalAmount: '0', transactionDate: new Date(),
        } as any }),
      );
    }

    operations.push(
      this.prisma.completeReport.update({ where: { id }, data: { approvalStatus: 'SUBMITTED', businessStatus: 'PENDING' } as any }),
    );

    // Transition production order back: COMPLETED → IN_PRODUCTION
    if (order.productionOrderId) {
      operations.push(
        this.prisma.productionOrder.updateMany({
          where: { id: order.productionOrderId, businessStatus: 'COMPLETED' },
          data: { businessStatus: 'IN_PRODUCTION' } as any,
        }),
      );
    }

    await this.prisma.$transaction(operations);
    return this.prisma.completeReport.findUniqueOrThrow({ where: { id } });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.completeReportLine.deleteMany({ where: { reportId: id } });
    await this.prisma.completeReport.delete({ where: { id } });
    return { message: "删除成功" };
  }
}
