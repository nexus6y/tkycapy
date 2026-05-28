import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CodeGeneratorService {
  constructor(private prisma: PrismaService) {}

  /** Generate a unique code with date-prefix + sequence */
  async generate(prefix: string, model: string, field: string): Promise<string> {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const pattern = `${prefix}${dateStr}`;
    const prismaModel = (this.prisma as any)[model];
    if (!prismaModel?.findFirst) return pattern + "0001";

    const last = await prismaModel.findFirst({
      where: { [field]: { startsWith: pattern } },
      orderBy: { [field]: "desc" },
    }).catch(() => null);

    const seq = last?.[field] ? parseInt(String(last[field]).slice(-4)) + 1 : 1;
    return `${pattern}${String(seq).padStart(4, "0")}`;
  }

  /** Prefix map for common entities */
  static PREFIXES: Record<string, string> = {
    material: "MAT", customer: "CUS", supplier: "SUP",
    contract: "CON", project: "PRJ", warehouse: "WH",
    quotation: "QTE", preOrder: "PRE", salesOrder: "SO",
    salesShipment: "SHIP", salesReturn: "SRT",
    demandPlan: "DP", purchasePlan: "PPLAN", purchaseOrder: "PO",
    purchaseReturn: "PRT", inspection: "INS",
    productionOrder: "PROD", issueOrder: "ISS", returnOrder: "RET",
    completeReport: "RPT",
    inboundOrder: "IN", outboundOrder: "OUT",
    transferOrder: "TR", scrapOrder: "SCRP", lendOrder: "LEND",
    checkOrder: "CHK", adjustOrder: "ADJ",
    zone: "ZONE", passage: "PASS", shelf: "SHF", location: "LOC",
  };
}
