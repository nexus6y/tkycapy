import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
@Module({ controllers: [QuotationController] })
export class QuotationModule {}
