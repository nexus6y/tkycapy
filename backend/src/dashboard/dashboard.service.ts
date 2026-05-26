import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const tables = [
      "material", "materialApproval", "quotation", "preOrder",
      "salesOrder", "salesShipment", "salesReturn", "demandPlan",
      "purchasePlan", "purchaseOrder", "purchaseReturn", "inspection",
      "productionOrder", "inboundOrder", "outboundOrder",
      "transferOrder", "lendOrder", "scrapOrder",
    ];

    let pending = 0;
    let mySubmissions = 0;
    let reviewed = 0;

    for (const table of tables) {
      const model = (this.prisma as any)[table];
      if (!model?.count) continue;
      try {
        const [submitted, approved] = await Promise.all([
          model.count({ where: { approvalStatus: "SUBMITTED" } }),
          model.count({ where: { approvalStatus: "APPROVED" } }),
        ]);
        pending += submitted;
        reviewed += approved;
      } catch {}
    }

    return { pending, mySubmissions, reviewed };
  }
}
