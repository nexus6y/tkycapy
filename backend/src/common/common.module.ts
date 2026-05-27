import { Global, Module } from "@nestjs/common";
import { CodeGeneratorService } from "./code-generator.service";
import { StockValidationService } from "./stock-validation.service";

@Global()
@Module({
  providers: [CodeGeneratorService, StockValidationService],
  exports: [CodeGeneratorService, StockValidationService],
})
export class CommonModule {}
