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

    const seqLen = last?.[field] ? String(last[field]).length - pattern.length : 4;
    const seq = last?.[field] ? parseInt(String(last[field]).slice(-Math.max(4, seqLen))) + 1 : 1;
    const padLen = Math.max(4, seqLen > 0 ? seqLen : 4);
    return `${pattern}${String(seq).padStart(padLen, "0")}`;
  }

  /** Prefix map for common entities */
  static PREFIXES: Record<string, string> = {
    material: "MAT", customer: "CUS", supplier: "SUP",
    contract: "CON", project: "PRJ", warehouse: "WH",
    quotation: "QTE", preOrder: "PRE", salesOrder: "SO",
    salesShipment: "SHIP", salesReturn: "SRT", purchaseReturn: "PRT",
    materialCategory: "MCAT", inspection: "INS",
    demandPlan: "DP", purchasePlan: "PPLAN", purchaseOrder: "PO",
    productionOrder: "PROD", issueOrder: "ISS", returnOrder: "RET",
    completeReport: "RPT",
    bom: "BOM", process: "PROC", processRoute: "RT",
    inboundOrder: "IN", outboundOrder: "OUT",
    transferOrder: "TR", scrapOrder: "SCRP", lendOrder: "LEND",
    checkOrder: "CHK", adjustOrder: "ADJ",
    zone: "ZONE", passage: "PASS", shelf: "SHF", location: "LOC",
  };
}
