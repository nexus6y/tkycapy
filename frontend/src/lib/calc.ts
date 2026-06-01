/**
 * 金额自动计算工具
 *
 * 原则：
 *   - 单行 amount = quantity × unitPrice
 *   - 主表 totalAmount = sum of line amounts
 *   - 主表 totalQuantity = sum of line quantities
 */
import type { LineItem } from '@/components/ui/lines-editor';

/** 单行金额 */
export function calcLineAmount(qty: number | string, price: number | string): string {
  return ((Number(qty) || 0) * (Number(price) || 0)).toFixed(2);
}

/** 主表总金额 — sum of line.amount */
export function calcTotalFromLines(lines: LineItem[]): string {
  return lines.reduce((s, l) => s + (Number(l.amount) || 0), 0).toFixed(2);
}

/** 主表总数量 — sum of line.quantity */
export function calcTotalQtyFromLines(lines: LineItem[]): string {
  return String(lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0));
}

/** 计算单行金额并返回更新后的行 */
export function recalcLineAmount(line: LineItem): LineItem {
  if (line.quantity != null && line.unitPrice != null) {
    return { ...line, amount: calcLineAmount(line.quantity, line.unitPrice) };
  }
  return line;
}

/** 计算 lines 中所有行的金额并返回更新后的列表 */
export function recalcAllLineAmounts(lines: LineItem[]): LineItem[] {
  return lines.map(recalcLineAmount);
}

/** 重新计算主表 totalAmount 和 totalQuantity */
export function recalcHeaderTotals(lines: LineItem[]) {
  return {
    totalAmount: calcTotalFromLines(lines),
    totalQuantity: calcTotalQtyFromLines(lines),
  };
}
