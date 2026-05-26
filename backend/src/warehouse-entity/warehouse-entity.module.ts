import { Module } from "@nestjs/common";
import { ZoneController, PassageController, ShelfController, LocationController, CheckOrderController } from "./zone.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ZoneController, PassageController, ShelfController, LocationController, CheckOrderController],
})
export class WarehouseEntityModule {}
