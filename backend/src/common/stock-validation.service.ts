import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StockValidationService {
  constructor(private prisma: PrismaService) {}

  /** Check if enough stock is available before outbound/issue */
  async checkAvailable(materialName: string, warehouseName: string, quantity: number) {
    if (!materialName || quantity <= 0) return;
    const inv = await this.prisma.inventory.findFirst({
      where: { materialName, warehouseName: warehouseName || undefined },
    });
    if (!inv || Number(inv.availableQty) < quantity) {
      const avail = inv ? Number(inv.availableQty) : 0;
      throw new BadRequestException(
        `库存不足: ${materialName}@${warehouseName || "任意仓库"} 可用${avail}, 需要${quantity}`
      );
    }
  }

  /** Check if material/warehouse inventory exists with enough total quantity */
  async checkQuantity(materialName: string, warehouseName: string, quantity: number) {
    if (!materialName || quantity <= 0) return;
    const inv = await this.prisma.inventory.findFirst({
      where: { materialName, warehouseName: warehouseName || undefined },
    });
    if (!inv || Number(inv.quantity) < quantity) {
      const total = inv ? Number(inv.quantity) : 0;
      throw new BadRequestException(
        `库存不足: ${materialName}@${warehouseName || "任意仓库"} 总量${total}, 需要${quantity}`
      );
    }
  }
}
