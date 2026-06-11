import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { pickAllowed } from '../common/dto-normalizer';

const INS_KEYS = ['inspectionNo','sourceType','sourceNo','materialId','materialName','quantity','qualifiedQty','unqualifiedQty','inspector','inspectionDate','result','approvalStatus','businessStatus','remark','tenantId'];

function clean(dto: any): any {
  const d = pickAllowed(dto, INS_KEYS);
  for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }
  return d;
}

@Controller('inspections')
export class InspectionController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status;
    if (code) where.inspectionNo = { contains: code };
    if (name) where.materialName = { contains: name };
    const [items, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize,
        ...(mode === 'detail' ? { include: { lines: { orderBy: { lineNo: 'asc' } } } } : {}),
      }),
      this.prisma.inspection.count({ where })
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.inspection.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const { lines, ...rawData } = dto;
    const orderData = clean(rawData);
    // Validate lines: qualified + unqualified ≤ inspectQty
    if (lines && Array.isArray(lines)) {
      for (const l of lines) {
        const inspectQty = Number(l.inspectQty || 0);
        const qualQty = Number(l.qualifiedQty || 0);
        const unqualQty = Number(l.unqualifiedQty || 0);
        if (qualQty + unqualQty > inspectQty) {
          throw new BadRequestException(`第${l.lineNo}行：合格数量(${qualQty})+不合格数量(${unqualQty})不能超过检验数量(${inspectQty})`);
        }
        if (unqualQty > 0 && !l.unqualifiedReason && !l.remark) {
          throw new BadRequestException(`第${l.lineNo}行：不合格数量>0时必须填写不合格原因`);
        }
      }
    }
    // Retry up to 3 times on unique constraint (code race)
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!dto.inspectionNo) dto.inspectionNo = await this.codeGen.generate('INS', 'inspection', 'inspectionNo');
      orderData.inspectionNo = dto.inspectionNo;
      try {
        if (lines && Array.isArray(lines) && lines.length > 0) {
          return await this.prisma.inspection.create({
            data: {
              ...orderData, tenantId,
              lines: { create: lines.map((l: any, i: number) => ({
                tenantId, lineNo: l.lineNo ?? i + 1,
                materialCode: l.materialCode, materialName: l.materialName,
                spec: l.spec, unit: l.unit,
                inspectQty: l.inspectQty != null ? String(l.inspectQty) : null,
                qualifiedQty: l.qualifiedQty != null ? String(l.qualifiedQty) : null,
                unqualifiedQty: l.unqualifiedQty != null ? String(l.unqualifiedQty) : null,
                result: l.result, remark: l.remark,
              })) },
            },
            include: { lines: true },
          } as any);
        }
        return await this.prisma.inspection.create({ data: { ...orderData, tenantId } as any });
      } catch (e: any) {
        if (e?.code === 'P2002' && attempt < 2) { dto.inspectionNo = ''; continue; }
        throw e;
      }
    }
    throw new BadRequestException('创建质检单失败');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...rawData } = dto;
    const orderData = clean(rawData);
    if (lines !== undefined) {
      await this.prisma.inspectionLine.deleteMany({ where: { inspectionId: id } });
      if (lines.length > 0) {
        const tenantId = await this.tid();
        await this.prisma.inspectionLine.createMany({
          data: lines.map((l: any, i: number) => ({
            tenantId, inspectionId: id, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName,
            spec: l.spec, unit: l.unit,
            inspectQty: l.inspectQty != null ? String(l.inspectQty) : null,
            qualifiedQty: l.qualifiedQty != null ? String(l.qualifiedQty) : null,
            unqualifiedQty: l.unqualifiedQty != null ? String(l.unqualifiedQty) : null,
            result: l.result, remark: l.remark,
          })),
        });
      }
      // If any line has a non-PENDING result, mark inspection as COMPLETED (质检完成)
      const hasResult = lines.some((l:any) => l.result && l.result !== 'PENDING');
      if (hasResult && !orderData.businessStatus) {
        orderData.businessStatus = 'COMPLETED';
      }
    }
    return this.prisma.inspection.update({
      where: { id }, data: orderData as any,
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.inspectionLine.deleteMany({ where: { inspectionId: id } });
    await this.prisma.inspection.delete({ where: { id } });
    return { message: '删除成功' };
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    const insp = await this.prisma.inspection.findUniqueOrThrow({ where: { id } });
    if (insp.approvalStatus !== 'DRAFT') throw new BadRequestException('只能提交草稿状态的质检单');
    return this.prisma.inspection.update({
      where: { id },
      data: { approvalStatus: 'SUBMITTED', businessStatus: 'PENDING' } as any,
    });
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string) {
    const insp = await this.prisma.inspection.findUniqueOrThrow({ where: { id } });
    if (insp.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能拒绝已提交的质检单');
    return this.prisma.inspection.update({ where: { id }, data: { approvalStatus: 'REJECTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const insp = await this.prisma.inspection.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    if (insp.approvalStatus !== 'SUBMITTED') {
      throw new BadRequestException(insp.approvalStatus === 'APPROVED' ? '该质检单已审核通过，不能重复审核' : '只能审核已提交的质检单');
    }

    // Idempotency: check if inbound already exists for this inspection
    const existingInbound = await this.prisma.inboundOrder.findFirst({
      where: { sourceType: 'INSPECTION', sourceNo: insp.inspectionNo },
    });
    if (existingInbound) {
      throw new BadRequestException(`该质检单已生成入库单 ${existingInbound.orderNo}，不能重复生成`);
    }

    // Cross-guard: if any inbound already exists for the same PO (manual, arrival-confirm, etc), reject
    if (insp.sourceType === 'PURCHASE_ORDER' && insp.sourceNo) {
      const anyInbound = await this.prisma.inboundOrder.findFirst({
        where: { sourceNo: insp.sourceNo, sourceType: { in: ['ARRIVAL_CONFIRM', 'PURCHASE'] } },
      });
      if (anyInbound) {
        throw new BadRequestException(`该采购订单已生成入库单 ${anyInbound.orderNo}（来源：${anyInbound.sourceType}），不能重复生成质检入库单`);
      }
    }

    // Default: mark all pending lines as qualified, use inspectQty as qualifiedQty
    if (insp.lines && insp.lines.length > 0) {
      for (const line of insp.lines) {
        const qty = Number(line.inspectQty || 0);
        const currentQual = Number(line.qualifiedQty || 0);
        const currentUnqual = Number(line.unqualifiedQty || 0);
        const resolved = (!line.result || line.result === 'PENDING') ? 'QUALIFIED' : line.result;
        const qualQty = currentQual > 0 ? String(currentQual) : String(qty - currentUnqual);
        const unqualQty = resolved === 'UNQUALIFIED' ? String(qty) : String(currentUnqual);
        const finalQualQty = resolved === 'UNQUALIFIED' ? '0' : qualQty;

        await this.prisma.inspectionLine.update({
          where: { id: line.id },
          data: {
            result: resolved,
            qualifiedQty: finalQualQty,
            unqualifiedQty: unqualQty,
          },
        });
      }
    }

    // Re-fetch with updated lines
    const updated = await this.prisma.inspection.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    // Sum line-level quantities to header
    const sumQual = String(updated.lines.reduce((s: number, l: any) => s + Number(l.qualifiedQty || 0), 0));
    const sumUnqual = String(updated.lines.reduce((s: number, l: any) => s + Number(l.unqualifiedQty || 0), 0));

    const tenantId = await this.tid();
    const inNo = await this.codeGen.generate('IN', 'inboundOrder', 'orderNo');
    const qualifiedLines = updated.lines && updated.lines.length > 0
      ? updated.lines.filter(l => l.result === 'QUALIFIED' && Number(l.qualifiedQty || 0) > 0)
      : [];

    const inboundLines = qualifiedLines.map(l => ({
      materialCode: l.materialCode, materialName: l.materialName,
      spec: l.spec, unit: l.unit,
      quantity: String(l.qualifiedQty || 0),
      warehouseCode: (l as any).warehouseCode || '',
      lineNo: l.lineNo,
    }));

    const totalQty = String(qualifiedLines.reduce((s, l) => s + Number(l.qualifiedQty || 0), 0));

    // Create inbound + update inspection status + update PO status ALL in ONE transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // ① Update inspection → APPROVED
      await tx.inspection.update({
        where: { id },
        data: { approvalStatus: 'APPROVED', businessStatus: 'COMPLETED', qualifiedQty: sumQual, unqualifiedQty: sumUnqual } as any,
      });

      // ② Create inbound order for qualified lines
      const inbound = await tx.inboundOrder.create({
        data: {
          tenantId, orderNo: inNo,
          sourceType: 'INSPECTION', sourceNo: updated.inspectionNo,
          materialName: updated.materialName,
          quantity: totalQty, qualifiedQty: totalQty,
          approvalStatus: 'DRAFT', businessStatus: 'PENDING',
          lines: inboundLines.length > 0 ? { create: inboundLines.map((l: any, i: number) => ({
            tenantId, lineNo: l.lineNo ?? i + 1,
            materialCode: l.materialCode, materialName: l.materialName || updated.materialName,
            spec: l.spec, unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : null,
            warehouseCode: l.warehouseCode || '',
          })) } : undefined,
        } as any,
      });

      return inbound;
    });

    return result;
  }
}
