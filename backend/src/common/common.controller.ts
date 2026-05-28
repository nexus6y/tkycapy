import { Controller, Get, Query } from '@nestjs/common';
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

  private getCodeField(entity: string): string {
    const map: Record<string, string> = {
      quotation: 'quotationNo', preOrder: 'orderNo', salesOrder: 'orderNo',
      salesShipment: 'shipmentNo', salesReturn: 'returnNo',
      productionOrder: 'orderNo', purchaseOrder: 'orderNo',
      issueOrder: 'orderNo', returnOrder: 'orderNo',
      completeReport: 'reportNo', scrapOrder: 'orderNo',
      lendOrder: 'orderNo', transferOrder: 'orderNo',
      inboundOrder: 'orderNo', outboundOrder: 'orderNo',
      checkOrder: 'orderNo', adjustOrder: 'orderNo',
      department: 'code', warehouse: 'code',
    };
    return map[entity] || 'code';
  }
}
