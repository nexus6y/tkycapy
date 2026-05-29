import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';

@Controller('inspections')
export class InspectionController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get()
  async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30, @Query('mode') mode?: string) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.inspectionNo = { contains: code };
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
    if (!dto.inspectionNo) dto.inspectionNo = await this.codeGen.generate('INS', 'inspection', 'inspectionNo');
    const { lines, ...orderData } = dto;
    if (lines && Array.isArray(lines) && lines.length > 0) {
      return this.prisma.inspection.create({
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
    return this.prisma.inspection.create({ data: { ...orderData, tenantId } as any });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const { lines, ...orderData } = dto;
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
    return this.prisma.inspection.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const insp = await this.prisma.inspection.findUniqueOrThrow({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    if (insp.approvalStatus !== 'SUBMITTED') {
      throw new Error(insp.approvalStatus === 'APPROVED' ? '该质检单已审核通过，不能重复审核' : '只能审核已提交的质检单');
    }

    // Idempotency: check if inbound already exists for this inspection
    const existingInbound = await this.prisma.inboundOrder.findFirst({
      where: { sourceType: 'INSPECTION', sourceNo: insp.inspectionNo },
    });
    if (existingInbound) {
      throw new Error(`该质检单已生成入库单 ${existingInbound.orderNo}，不能重复生成`);
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

    await this.prisma.inspection.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });

    const tenantId = await this.tid();
    const inNo = await this.codeGen.generate('IN', 'inboundOrder', 'orderNo');
    const qualifiedLines = updated.lines && updated.lines.length > 0
      ? updated.lines.filter(l => l.result === 'QUALIFIED' && Number(l.qualifiedQty || 0) > 0)
      : [];

    const inboundLines = qualifiedLines.map(l => ({
      materialCode: l.materialCode, materialName: l.materialName,
      spec: l.spec, unit: l.unit,
      quantity: String(l.qualifiedQty || 0),
      warehouseCode: (l as any).warehouseCode,
      lineNo: l.lineNo,
    }));

    const totalQty = String(qualifiedLines.reduce((s, l) => s + Number(l.qualifiedQty || 0), 0));

    await this.prisma.inboundOrder.create({
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
          warehouseCode: l.warehouseCode,
        })) } : undefined,
      } as any,
    });
    return updated;
  }
}
