import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { pickAllowed } from '../common/dto-normalizer';

const KEYS = ['returnNo','purchaseOrderId','purchaseOrderNo','supplierId','supplierCode','supplierName','materialName','returnDate','totalQuantity','totalAmount','returnReason','approvalStatus','businessStatus','remark','tenantId'];
function clean(dto: any, tid: string): any {
  const data = pickAllowed(dto, KEYS); data.tenantId = tid;
  for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
  if (data.returnDate) data.returnDate = new Date(data.returnDate);
  if (data.totalQuantity != null) data.totalQuantity = String(data.totalQuantity);
  if (data.totalAmount != null) data.totalAmount = String(data.totalAmount);
  return data;
}
@Controller('purchase-returns')
export class PurchaseReturnController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }
  @Get() async findAll(@Query('status') status?: string, @Query('code') code?: string, @Query('name') name?: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const tenantId = await this.tid(); const where: any = { tenantId };
    if (status) where.approvalStatus = status; if (code) where.returnNo = { contains: code }; if (name) where.supplierName = { contains: name };
    const [items, total] = await Promise.all([this.prisma.purchaseReturn.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }), this.prisma.purchaseReturn.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.purchaseReturn.findUniqueOrThrow({ where: { id } }); }
  @Post() async create(@Body() dto: any) {
    try {
      const tenantId = await this.tid();
      if (!dto.returnNo) dto.returnNo = await this.codeGen.generate('PRT', 'purchaseReturn', 'returnNo');
      return await this.prisma.purchaseReturn.create({ data: clean(dto, tenantId) });
    }
    catch (e: any) { if (e.code === 'P2002') throw new HttpException('退货单号已存在', HttpStatus.BAD_REQUEST); throw e; }
  }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { const tenantId = await this.tid(); return this.prisma.purchaseReturn.update({ where: { id }, data: clean(dto, tenantId) }); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.purchaseReturn.delete({ where: { id } }); return { message: '删除成功' }; }
  @Put(':id/submit') async submit(@Param('id') id: string) { return this.prisma.purchaseReturn.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }
  @Put(':id/approve') async approve(@Param('id') id: string) { return this.prisma.purchaseReturn.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any }); }
}
