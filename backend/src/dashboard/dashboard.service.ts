import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const tables = [
      "material", "materialApproval", "quotation", "preOrder",
      "salesOrder", "salesShipment", "salesReturn", "demandPlan",
      "purchasePlan", "inspection", "productionOrder",
      "inboundOrder", "outboundOrder", "transferOrder",
      "lendOrder", "scrapOrder", "issueOrder", "returnOrder",
      "adjustOrder", "completeReport", "checkOrder",
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

    const [invCount, invTotalQty, inboundCount, outboundCount, costCount] = await Promise.all([
      this.prisma.inventory.count().catch(() => 0),
      this.prisma.inventory.findMany().then(items => items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0)).catch(() => 0),
      this.prisma.inboundOrder.count({ where: { approvalStatus: 'APPROVED' } }).catch(() => 0),
      this.prisma.outboundOrder.count({ where: { approvalStatus: 'APPROVED' } }).catch(() => 0),
      this.prisma.costLedger.count().catch(() => 0),
    ]);

    return { pending, mySubmissions, reviewed, inventoryItems: invCount, inventoryQty: invTotalQty, inboundApproved: inboundCount, outboundApproved: outboundCount, costEntries: costCount };
  }
}
