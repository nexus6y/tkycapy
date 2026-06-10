import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { CodeGeneratorService } from './code-generator.service';

@Controller('common')
export class CommonController {
  constructor(private readonly codeGen: CodeGeneratorService) {}

  @Get('next-code')
  async nextCode(@Query('entity') entity: string) {
    const prefix = CodeGeneratorService.PREFIXES[entity];
    if (!prefix) return { code: null, error: `未知实体: ${entity}` };
    const code = await this.codeGen.generate(prefix, entity, this.getCodeField(entity));
    return { code };
  }

  @Public()
  @Get('health')
  health() {
    return {
      ok: true,
      env: {
        databaseUrl: Boolean(process.env.DATABASE_URL),
        jwtSecret: Boolean(process.env.JWT_SECRET),
        nodeEnv: process.env.NODE_ENV || null,
        vercel: Boolean(process.env.VERCEL),
      },
    };
  }

  private getCodeField(entity: string): string {
    const map: Record<string, string> = {
      quotation: 'quotationNo', preOrder: 'orderNo', salesOrder: 'orderNo',
      salesShipment: 'shipmentNo', salesReturn: 'returnNo', purchaseReturn: 'returnNo',
      materialCategory: 'code',
      productionOrder: 'orderNo', purchaseOrder: 'orderNo',
      issueOrder: 'orderNo', returnOrder: 'orderNo',
      completeReport: 'reportNo', scrapOrder: 'orderNo',
      lendOrder: 'orderNo', transferOrder: 'orderNo',
      inboundOrder: 'orderNo', outboundOrder: 'orderNo',
      checkOrder: 'orderNo', adjustOrder: 'orderNo',
      department: 'code', warehouse: 'code',
      bom: 'code', process: 'code', processRoute: 'code',
      inspection: 'inspectionNo', demandPlan: 'planNo', purchasePlan: 'orderNo',
    };
    return map[entity] || 'code';
  }
}
