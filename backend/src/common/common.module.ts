import { Global, Module } from "@nestjs/common";
import { CodeGeneratorService } from "./code-generator.service";
import { StockValidationService } from "./stock-validation.service";
import { CommonController } from "./common.controller";

@Global()
@Module({
  controllers: [CommonController],
  providers: [CodeGeneratorService, StockValidationService],
  exports: [CodeGeneratorService, StockValidationService],
})
export class CommonModule {}
