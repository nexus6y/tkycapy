import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";
import { guardSubmit, guardApprove } from "../common/business-rules.helper";
import { pickAllowed } from "../common/dto-normalizer";

const ZONE_KEYS = ['code','name','type','warehouseId','warehouseName','status','sortOrder','tenantId'];
const PASS_KEYS = ['code','name','type','zoneId','zoneName','status','sortOrder','tenantId'];
const SHELF_KEYS = ['code','name','machineType','spec','passageId','passageName','zoneName','warehouseName','areaName','status','sortOrder','tenantId'];
const LOC_KEYS = ['code','name','type','usageStatus','shelfId','shelfName','layer','col','zoneName','warehouseName','status','sortOrder','tenantId'];
const CHK_KEYS = ['orderNo','checkMethod','checkResult','locationCode','materialId','materialCode','materialName','spec','unit','batchNo','stockQty','checkQty','diffQty','areaName','warehouseId','warehouseCode','warehouseName','zoneName','inspector','checkDate','approvalStatus','businessStatus','remark','tenantId'];

function clean(dto: any, keys: string[]): any {
  const data = pickAllowed(dto, keys);
  for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
  return data;
}
function cleanChk(dto: any): any {
  const data = clean(dto, CHK_KEYS);
  if (data.checkDate) data.checkDate = new Date(data.checkDate);
  ['stockQty','checkQty','diffQty'].forEach(f => { if (data[f] != null) data[f] = String(data[f]); });
  return data;
}

@Controller("zones")
export class ZoneController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }
  @Get() async findAll(@Query("code") code?: string, @Query("name") name?: string, @Query("status") status?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (code) where.code = { contains: code }; if (name) where.name = { contains: name }; if (status) where.status = status;
    const [items, total] = await Promise.all([this.prisma.zone.findMany({ where, orderBy: { sortOrder: "asc" }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.zone.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.zone.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); const data = clean(dto, ZONE_KEYS); data.tenantId = tenantId; if (!data.code) data.code = await this.codeGen.generate('ZONE', 'zone', 'code'); return this.prisma.zone.create({ data }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.zone.update({ where: { id }, data: clean(dto, ZONE_KEYS) }); }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.zone.delete({ where: { id } }); return { message: "删除成功" }; }
}

@Controller("passages")
export class PassageController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }
  @Get() async findAll(@Query("code") code?: string, @Query("name") name?: string, @Query("status") status?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (code) where.code = { contains: code }; if (name) where.name = { contains: name }; if (status) where.status = status;
    const [items, total] = await Promise.all([this.prisma.passage.findMany({ where, orderBy: { sortOrder: "asc" }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.passage.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.passage.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); const data = clean(dto, PASS_KEYS); data.tenantId = tenantId; return this.prisma.passage.create({ data }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.passage.update({ where: { id }, data: clean(dto, PASS_KEYS) }); }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.passage.delete({ where: { id } }); return { message: "删除成功" }; }
}

@Controller("shelves")
export class ShelfController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }
  @Get() async findAll(@Query("code") code?: string, @Query("name") name?: string, @Query("status") status?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (code) where.code = { contains: code }; if (name) where.name = { contains: name }; if (status) where.status = status;
    const [items, total] = await Promise.all([this.prisma.shelf.findMany({ where, orderBy: { sortOrder: "asc" }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.shelf.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.shelf.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); const data = clean(dto, SHELF_KEYS); data.tenantId = tenantId; return this.prisma.shelf.create({ data }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.shelf.update({ where: { id }, data: clean(dto, SHELF_KEYS) }); }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.shelf.delete({ where: { id } }); return { message: "删除成功" }; }
}

@Controller("locations")
export class LocationController {
  constructor(private prisma: PrismaService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }
  @Get() async findAll(@Query("code") code?: string, @Query("name") name?: string, @Query("status") status?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (code) where.code = { contains: code }; if (name) where.name = { contains: name }; if (status) where.status = status;
    const [items, total] = await Promise.all([this.prisma.location.findMany({ where, orderBy: { sortOrder: "asc" }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.location.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.location.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); const data = clean(dto, LOC_KEYS); data.tenantId = tenantId; return this.prisma.location.create({ data }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.location.update({ where: { id }, data: clean(dto, LOC_KEYS) }); }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.location.delete({ where: { id } }); return { message: "删除成功" }; }
}

@Controller("check-orders")
export class CheckOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: "default" } })).id; }
  @Get() async findAll(@Query("code") code?: string, @Query("name") name?: string, @Query("status") status?: string, @Query("page") page = 1, @Query("pageSize") pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (code) where.orderNo = { contains: code }; if (name) where.materialName = { contains: name }; if (status) where.approvalStatus = status;
    const [items, total] = await Promise.all([this.prisma.checkOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.checkOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(":id") async findOne(@Param("id") id: string) { return this.prisma.checkOrder.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) {
    const tenantId = await this.tid();
    const data = cleanChk(dto);
    data.tenantId = tenantId;
    if (!data.orderNo) data.orderNo = await this.codeGen.generate('CHK', 'checkOrder', 'orderNo');
    return this.prisma.checkOrder.create({ data });
  }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) {
    const data = cleanChk(dto);
    return this.prisma.checkOrder.update({ where: { id }, data });
  }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.checkOrder.delete({ where: { id } }); return { message: "删除成功" }; }

  @Put(":id/submit")
  async submit(@Param("id") id: string) {
    await guardSubmit(this.prisma, 'checkOrder', id);
    return this.prisma.checkOrder.update({ where: { id }, data: { approvalStatus: "SUBMITTED" } as any });
  }

  @Put(":id/approve")
  async approve(@Param("id") id: string) {
    await guardApprove(this.prisma, 'checkOrder', id);
    return this.prisma.checkOrder.update({ where: { id }, data: { approvalStatus: "APPROVED" } as any });
  }

  // Push-down: generate adjust order from check order (idempotent) — only when diffQty != 0
  @Post(":id/generate-adjust-order")
  async generateAdjustOrder(@Param("id") id: string) {
    const tenantId = await this.tid();
    return await this.prisma.$transaction(async (tx) => {
      const chk = await tx.checkOrder.findUniqueOrThrow({ where: { id } });

      if (chk.approvalStatus !== 'APPROVED') throw new BadRequestException('只能从已审批的盘点单生成调整单');
      if (!chk.diffQty || Number(chk.diffQty) === 0) throw new BadRequestException('盘点差异为0，无需生成调整单');

      // Idempotency: one check order → one adjust order
      const existing = await tx.adjustOrder.findFirst({
        where: { checkOrderId: id },
      });
      if (existing) throw new BadRequestException(`该盘点单已存在调整单 ${existing.orderNo}，不能重复下推`);

      const adjNo = await this.codeGen.generate('ADJ', 'adjustOrder', 'orderNo');
      const adjQty = Number(chk.diffQty);
      const reason = adjQty > 0 ? `盘点盈余：库存${Number(chk.stockQty)}→盘点${Number(chk.checkQty)}，差异+${adjQty}` : `盘点亏损：库存${Number(chk.stockQty)}→盘点${Number(chk.checkQty)}，差异${adjQty}`;

      await tx.adjustOrder.create({
        data: {
          tenantId, orderNo: adjNo,
          checkOrderId: chk.id, checkOrderNo: chk.orderNo,
          // Copy precise inventory location fields from check order
          materialCode: chk.materialCode, materialName: chk.materialName,
          spec: chk.spec, unit: chk.unit,
          warehouseCode: chk.warehouseCode || chk.warehouseName, warehouseName: chk.warehouseName,
          locationCode: chk.locationCode || '', batchNo: chk.batchNo || '',
          adjustQty: String(adjQty), adjustReason: reason,
          approvalStatus: 'DRAFT', businessStatus: 'PENDING',
        } as any,
      });

      return { message: '调整单已生成', adjustOrderNo: adjNo };
    });
  }
}
