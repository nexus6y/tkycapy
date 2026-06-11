import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';
import { pickAllowed } from '../common/dto-normalizer';
import { guardSubmit, guardApprove, guardWithdraw } from '../common/business-rules.helper';

const KEYS = ['orderNo','materialId','materialCode','materialName','spec','unit','quantity','scrapReason','disposalMethod','approvalStatus','businessStatus','scrapDate','remark','tenantId'];
function clean(dto: any): any { const d = pickAllowed(dto, KEYS); for (const k of Object.keys(d)) { if (d[k] === '' || d[k] === null) delete d[k]; }; if (d.scrapDate) d.scrapDate = new Date(d.scrapDate); if (d.quantity != null) d.quantity = String(d.quantity); return d; }

@Controller('scrap-orders')
export class ScrapOrderController {
  constructor(private prisma: PrismaService, private codeGen: CodeGeneratorService) {}
  private async tid() { return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id; }

  @Get() async findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 30,
    @Query('status') status?: string,
    @Query('code') code?: string,
    @Query('name') name?: string,
  ) {
    const tid = await this.tid(); const where: any = { tenantId: tid };
    if (status) where.approvalStatus = status;
    if (code) where.orderNo = { contains: code };
    if (name) where.materialName = { contains: name };
    const [items, total] = await Promise.all([this.prisma.scrapOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.scrapOrder.count({ where })]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  @Get(':id') async findOne(@Param('id') id: string) { return this.prisma.scrapOrder.findUniqueOrThrow({ where: { id } }); }

  @Post() async create(@Body() dto: any) {
    try { const tid = await this.tid(); const data = clean(dto); if (!data.orderNo) data.orderNo = await this.codeGen.generate('SCRP', 'scrapOrder', 'orderNo'); data.tenantId = tid; return await this.prisma.scrapOrder.create({ data }); }
    catch (e: any) { if (e.code === 'P2002') throw new HttpException('单号已存在', HttpStatus.BAD_REQUEST); throw e; }
  }

  @Put(':id') async update(@Param('id') id: string, @Body() dto: any) { return this.prisma.scrapOrder.update({ where: { id }, data: clean(dto) }); }

  @Put(':id/submit') async submit(@Param('id') id: string) { await guardSubmit(this.prisma, 'scrapOrder', id); return this.prisma.scrapOrder.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any }); }

  @Put(':id/approve') async approve(@Param('id') id: string) {
    const order = await guardApprove(this.prisma, 'scrapOrder', id);
    await this.prisma.scrapOrder.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
    const inv = await this.prisma.inventory.findFirst({ where: { materialName: order.materialName || '' } });
    if (inv) { const q = Math.max(0,(Number(inv.quantity)||0)-(Number(order.quantity)||0)); await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: String(q), availableQty: String(q) } }); }
    return order;
  }

  @Put(':id/withdraw') async withdraw(@Param('id') id: string) { await guardWithdraw(this.prisma, 'scrapOrder', id); return this.prisma.scrapOrder.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any }); }

  @Delete(':id') async remove(@Param('id') id: string) { await this.prisma.scrapOrder.delete({ where: { id } }); return { message: '删除成功' }; }

  @Post(':id/push-to-purchase-plan')
  async pushToPurchasePlan(@Param('id') id: string) {
    const so = await this.prisma.scrapOrder.findUniqueOrThrow({ where: { id } });
    if (so.approvalStatus !== 'APPROVED') throw new HttpException('只有已通过的制损单可下推采购计划', HttpStatus.BAD_REQUEST);
    if (so.purchasePlanId) throw new HttpException(`已生成采购计划 ${so.purchasePlanNo}，不可重复下推`, HttpStatus.BAD_REQUEST);

    const tid = await this.tid();
    const ppNo = await this.codeGen.generate('PPLAN', 'purchasePlan', 'orderNo');
    const requiredDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const pp = await this.prisma.$transaction(async (tx) => {
      const plan = await tx.purchasePlan.create({
        data: {
          tenantId: tid, orderNo: ppNo,
          orderName: `制损补料-${so.materialName || so.orderNo}`,
          materialName: so.materialName,
          quantity: so.quantity,
          requiredDate,
          approvalStatus: 'DRAFT', businessStatus: 'PENDING',
          remark: `制损下推: ${so.orderNo} 损坏原因: ${so.scrapReason || ''}`,
          lines: {
            create: {
              tenantId: tid,
              lineNo: 1,
              materialCode: so.materialCode || '',
              materialName: so.materialName || '',
              spec: so.spec || '',
              unit: so.unit || '',
              quantity: so.quantity != null ? String(so.quantity) : '0',
              requiredDate,
              remark: `制损下推: ${so.orderNo}`,
            },
          },
        },
      });
      await tx.scrapOrder.update({ where: { id }, data: { purchasePlanId: plan.id, purchasePlanNo: ppNo } });
      return plan;
    });

    return { message: '采购计划已生成', purchasePlanId: pp.id, purchasePlanNo: ppNo };
  }
}
