import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";
import { pickAllowed } from "../common/dto-normalizer";

const ADJ_KEYS = ['orderNo','checkOrderId','checkOrderNo','materialCode','materialName','spec','unit','warehouseCode','warehouseName','locationCode','batchNo','qualityStatus','adjustQty','adjustReason','approvalStatus','businessStatus','tenantId'];

function clean(dto: any): any {
  const d = pickAllowed(dto, ADJ_KEYS);
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }
  return d;
}

@Controller("adjust-orders")
export class AdjustOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }

  @Get() async findAll(@Query("status") status?: string, @Query("code") code?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.orderNo = { contains: code };
    const [items, total] = await Promise.all([this.prisma.adjustOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.adjustOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.adjustOrder.findUniqueOrThrow({ where: { id } }); }

  @Post() async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const data = clean(dto);
    data.tenantId = tenantId;
    if (!data.orderNo) data.orderNo = await this.codeGen.generate('ADJ', 'adjustOrder', 'orderNo');
    try {
      return await this.prisma.adjustOrder.create({ data: data as any });
    } catch (e: any) {
      if (e.code === 'P2002') throw new HttpException('调整单号已存在', HttpStatus.BAD_REQUEST);
      throw e;
    }
  }

  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) {
    const data = clean(dto);
    return this.prisma.adjustOrder.update({ where: { id }, data: data as any });
  }

  @Put(":id/submit") async submit(@Param("id") id: string) {
    const order = await this.prisma.adjustOrder.findUniqueOrThrow({ where: { id } });
    if (order.approvalStatus !== 'DRAFT') throw new BadRequestException('只有草稿状态的调整单可以提交');
    return this.prisma.adjustOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any });
  }

  /**
   * Build a precise inventory lookup where clause from adjust order fields.
   * Falls back to warehouseName if warehouseCode is empty.
   */
  private buildInventoryWhere(order: any, tenantId: string) {
    const where: any = { tenantId };
    // Primary keys — use whatever is available
    if (order.materialCode) where.materialCode = order.materialCode;
    if (order.warehouseCode) {
      where.warehouseCode = order.warehouseCode;
    } else if (order.warehouseName) {
      where.warehouseCode = order.warehouseName; // warehouse names are codes in this system
    }
    if (order.locationCode) where.locationCode = order.locationCode;
    if (order.batchNo) where.batchNo = order.batchNo;
    if (order.qualityStatus) where.qualityStatus = order.qualityStatus;
    // If no precise fields provided, fall back to materialName + warehouse
    if (!order.materialCode && !order.warehouseCode && !order.warehouseName) {
      delete where.materialCode;
      delete where.warehouseCode;
      where.materialName = order.materialName;
      if (order.warehouseName) where.warehouseName = order.warehouseName;
    }
    return where;
  }

  @Put(":id/approve") async approve(@Param("id") id: string) {
    const tenantId = await this.tid();
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.adjustOrder.findUniqueOrThrow({ where: { id } });
      if (order.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能审批已提交的调整单');

      const adjQty = Number(order.adjustQty || 0);

      // Find inventory with precise location matching
      const where = this.buildInventoryWhere(order, tenantId);
      const inv = await tx.inventory.findFirst({ where });

      if (!inv) {
        throw new BadRequestException(
          `找不到匹配的库存记录（物料:${order.materialName || order.materialCode || '-'}, ` +
          `仓库:${order.warehouseCode || order.warehouseName || '-'}, ` +
          `库位:${order.locationCode || '-'}, 批次:${order.batchNo || '-'}）。` +
          `请确认盘点单的物料/仓库/库位信息与库存记录一致。`
        );
      }

      const newQty = (Number(inv.quantity) || 0) + adjQty;
      const newAvail = (Number(inv.availableQty) || 0) + adjQty;

      // Negative stock guard: reject when adjustment would drive stock below 0
      if (newQty < 0 || newAvail < 0) {
        throw new BadRequestException(
          `调整后库存为负（当前:${inv.quantity}, 调整:${adjQty > 0 ? '+' : ''}${adjQty}, ` +
          `结果:${newQty}）。不允许盘亏超出当前库存数量。`
        );
      }

      await tx.adjustOrder.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });

      await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: String(newQty), availableQty: String(newAvail) },
      });

      // Inventory transaction
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          transactionNo: `ADJ-TXN-${order.orderNo}`,
          transactionType: 'ADJUST',
          sourceType: 'adjust_order', sourceNo: order.orderNo,
          materialCode: order.materialCode || inv.materialCode,
          materialName: order.materialName || inv.materialName,
          spec: order.spec || inv.spec, unit: order.unit || inv.unit,
          warehouseCode: order.warehouseCode || inv.warehouseCode,
          locationCode: order.locationCode || inv.locationCode,
          batchNo: order.batchNo || inv.batchNo,
          qualityStatus: order.qualityStatus || inv.qualityStatus,
          projectCode: inv.projectCode,
          quantity: String(adjQty),
          balanceQty: String(newQty),
          transactionDate: new Date(),
        } as any,
      });

      // Cost ledger
      await tx.costLedger.create({
        data: {
          tenantId,
          transactionNo: `ADJ-LDG-${order.orderNo}`,
          transactionType: 'ADJUST',
          materialName: order.materialName || inv.materialName,
          quantity: String(Math.abs(adjQty)),
          unitPrice: '0',
          totalAmount: '0',
          transactionDate: new Date(),
          remark: `盘点调整: ${order.adjustReason || '-'}`,
        } as any,
      });

      return { message: '调整单已审批，库存已更新' };
    });
  }

  @Put(":id/cancel-approve")
  async cancelApprove(@Param("id") id: string) {
    const tenantId = await this.tid();
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.adjustOrder.findUniqueOrThrow({ where: { id } });
      if (order.approvalStatus !== 'APPROVED') throw new BadRequestException('只能撤销已审批的调整单');

      const adjQty = Number(order.adjustQty || 0);

      // Find inventory with precise matching (same logic as approve)
      const where = this.buildInventoryWhere(order, tenantId);
      const inv = await tx.inventory.findFirst({ where });

      if (inv) {
        const newQty = (Number(inv.quantity) || 0) - adjQty;
        const newAvail = (Number(inv.availableQty) || 0) - adjQty;
        await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: String(Math.max(0, newQty)), availableQty: String(Math.max(0, newAvail)) },
        });

        await tx.inventoryTransaction.deleteMany({
          where: { sourceType: 'adjust_order', sourceNo: order.orderNo },
        });
        await tx.costLedger.deleteMany({
          where: { transactionNo: `ADJ-LDG-${order.orderNo}` },
        });
      }

      await tx.adjustOrder.update({ where: { id }, data: { approvalStatus: "DRAFT" } as any });

      return { message: '调整单已撤销审批' };
    });
  }

  @Delete(":id") async remove(@Param("id") id: string) {
    await this.prisma.adjustOrder.delete({ where: { id } });
    return { message: "删除成功" };
  }
}

function num(v: any): number { try { return Number(v) || 0 } catch { return 0 } }
