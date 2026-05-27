import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodeGeneratorService } from "../common/code-generator.service";

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
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); if (!dto.code) dto.code = await this.codeGen.generate('ZONE', 'zone', 'code'); return this.prisma.zone.create({ data: { ...dto, tenantId } }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.zone.update({ where: { id }, data: dto }); }
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
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.passage.create({ data: { ...dto, tenantId } }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.passage.update({ where: { id }, data: dto }); }
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
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.shelf.create({ data: { ...dto, tenantId } }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.shelf.update({ where: { id }, data: dto }); }
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
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); return this.prisma.location.create({ data: { ...dto, tenantId } }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.location.update({ where: { id }, data: dto }); }
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
  @Post() async create(@Body() dto: any) { const tenantId = await this.tid(); if (!dto.orderNo) dto.orderNo = await this.codeGen.generate('CHK', 'checkOrder', 'orderNo'); return this.prisma.checkOrder.create({ data: { ...dto, tenantId } }); }
  @Put(":id") async update(@Param("id") id: string, @Body() dto: any) { return this.prisma.checkOrder.update({ where: { id }, data: dto }); }
  @Delete(":id") async remove(@Param("id") id: string) { await this.prisma.checkOrder.delete({ where: { id } }); return { message: "删除成功" }; }
}
