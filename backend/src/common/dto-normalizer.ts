/**
 * 通用 DTO 清洗工具 — 防止空字符串传入 Prisma DateTime/Decimal/Int/Relation
 *
 * 规则：
 * - 空值 (''/null/undefined/none/NONE/无/ALL/请选择) → undefined/null
 * - 非空非法值 → 抛 BadRequestException (明确提示哪个字段值非法)
 * - toDecimal/toInt/toDate 只对空值静默，非空非法值必须抛异常
 */
import { BadRequestException } from '@nestjs/common';

/** 将空/占位值转为 undefined */
export function normalizeEmpty(v: any): any {
  if (v === '' || v === null || v === undefined) return undefined;
  if (typeof v === 'string' && ['null', 'undefined', 'none', 'NONE', '无', 'ALL', '请选择'].includes(v)) return undefined;
  return v;
}

/** 外键 ID 清洗 — 空串/"none"等 → null；有值原样返回 */
export function normalizeRelationId(id: any): string | null {
  const v = normalizeEmpty(id);
  return v || null;
}

/** Decimal 字段清洗 — 空 → undefined; 非数字非空 → BadRequest */
export function toDecimal(v: any, fieldName?: string): string | undefined {
  const n = normalizeEmpty(v);
  if (n === undefined) return undefined;
  const num = Number(n);
  if (isNaN(num)) throw new BadRequestException(`${fieldName || '数值字段'}值非法，期望数字`);
  return String(num);
}

/** Int 字段清洗 — 空 → undefined; 非整数非空 → BadRequest */
export function toInt(v: any, fieldName?: string): number | undefined {
  const n = normalizeEmpty(v);
  if (n === undefined) return undefined;
  const num = Math.floor(Number(n));
  if (isNaN(num) || String(num) !== String(n).split('.')[0]) {
    throw new BadRequestException(`${fieldName || '整数字段'}值非法，期望整数`);
  }
  return num;
}

/** Date 字段清洗 — 空 → undefined; InvalidDate 非空 → BadRequest */
export function toDate(v: any, fieldName?: string): Date | undefined {
  const n = normalizeEmpty(v);
  if (n === undefined) return undefined;
  const d = new Date(n);
  if (isNaN(d.getTime())) throw new BadRequestException(`${fieldName || '日期字段'}值非法：${String(n)}`);
  return d;
}

/** Boolean 字段清洗 */
export function toBoolean(v: any): boolean | undefined {
  if (v === true || v === 'true' || v === '是' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === '否' || v === 0 || v === '0') return false;
  const n = normalizeEmpty(v);
  if (n === undefined) return undefined;
  return Boolean(v);
}

/** 白名单过滤 — 只保留 allowedKeys 中的字段 */
export function pickAllowed(dto: any, allowedKeys: string[]): any {
  const data: any = {};
  const set = new Set(allowedKeys);
  for (const k of Object.keys(dto)) {
    if (set.has(k)) data[k] = dto[k];
  }
  return data;
}

/** 批量 normalize — 对 data 对象的指定字段执行清洗 */
export function normalizeFields(data: any, specs: Record<string, string>) {
  for (const [key, type] of Object.entries(specs)) {
    if (!(key in data)) continue;
    switch (type) {
      case 'relationId': data[key] = normalizeRelationId(data[key]); break;
      case 'decimal': data[key] = toDecimal(data[key], key); break;
      case 'int': data[key] = toInt(data[key], key); break;
      case 'date': data[key] = toDate(data[key], key); break;
      case 'boolean': data[key] = toBoolean(data[key]); break;
      case 'empty': data[key] = normalizeEmpty(data[key]); break;
    }
  }
}

/**
 * 校验外键存在 — id 非空时查询
 * prisma 需要提供 modelName 对应的 Prisma delegate (e.g. prisma.materialCategory)
 */
export async function validateForeignKey(
  prismaDelegate: any,
  id: string | null | undefined,
  modelName: string,
): Promise<void> {
  const rid = normalizeRelationId(id);
  if (!rid) return;
  const record = await prismaDelegate.findUnique({ where: { id: rid } });
  if (!record) throw new BadRequestException(`${modelName}不存在或已被删除：${rid}`);
}
