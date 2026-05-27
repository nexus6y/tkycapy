import { BadRequestException } from "@nestjs/common";

export function validateSubmit(s: string) { if (s !== 'DRAFT') throw new BadRequestException('只有草稿状态的单据可以提交'); }
export function validateApprove(s: string) { if (s !== 'SUBMITTED') throw new BadRequestException('只能审批已提交的单据'); }
export function validateWithdraw(s: string) { if (s !== 'SUBMITTED') throw new BadRequestException('只能撤回已提交的单据'); }

export async function guardApprove(prisma: any, model: string, id: string) {
  const e = await prisma[model].findUniqueOrThrow({ where: { id } });
  validateApprove(e.approvalStatus); return e;
}
export async function guardSubmit(prisma: any, model: string, id: string) {
  const e = await prisma[model].findUniqueOrThrow({ where: { id } });
  validateSubmit(e.approvalStatus); return e;
}
export async function guardWithdraw(prisma: any, model: string, id: string) {
  const e = await prisma[model].findUniqueOrThrow({ where: { id } });
  validateWithdraw(e.approvalStatus); return e;
}
