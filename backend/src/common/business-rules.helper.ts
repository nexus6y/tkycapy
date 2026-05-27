import { BadRequestException } from "@nestjs/common";

/** Validate status transitions for submit and approve operations */
export function validateSubmit(currentStatus: string) {
  if (currentStatus !== 'DRAFT') throw new BadRequestException('只有草稿状态的单据可以提交');
}

export function validateApprove(currentStatus: string) {
  if (currentStatus !== 'SUBMITTED') throw new BadRequestException('只能审批已提交的单据');
}

/** Shorthand: fetch entity, validate status, return entity */
export async function guardApprove(prisma: any, model: string, id: string) {
  const entity = await prisma[model].findUniqueOrThrow({ where: { id } });
  validateApprove(entity.approvalStatus);
  return entity;
}

export async function guardSubmit(prisma: any, model: string, id: string) {
  const entity = await prisma[model].findUniqueOrThrow({ where: { id } });
  validateSubmit(entity.approvalStatus);
  return entity;
}
