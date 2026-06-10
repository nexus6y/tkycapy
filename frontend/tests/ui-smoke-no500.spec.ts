/**
 * UI 无500 Smoke — 仅验证每个 create 页面可打开、有保存按钮、点击保存不 500
 * 不要求保存成功，只验证不会爆炸。
 */
import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3000';

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('button:has-text("登 录")');
  await page.waitForURL('**/');
  await page.waitForTimeout(500);
}

test.describe('UI No500 Smoke', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  for (const [path, label] of [
    ['/material-category/create', 'mat-cat'], ['/material/create', 'material'],
    ['/sales/customer/create', 'customer'], ['/purchase/supplier/create', 'supplier'],
    ['/project/create', 'project'], ['/warehouse/warehouse/create', 'warehouse'],
    ['/system/dept/create', 'dept'], ['/system/dict/create', 'dict'],
    ['/system/role/create', 'role'], ['/system/user/create', 'user'],
    ['/system/menu/create', 'menu'], ['/system/permission/create', 'perm'],
    ['/sales/return/create', 'sales-return'], ['/purchase/return/create', 'purchase-return'],
    ['/contract/create', 'contract'], ['/production/process/create', 'process'],
    ['/production/route/create', 'route'], ['/production/bom/create', 'bom'],
    ['/production/order/create', 'prod-order'], ['/production/issue/create', 'issue'],
    ['/production/return/create', 'return'], ['/production/change/create', 'change'],
    ['/warehouse/inbound/create', 'inbound'], ['/warehouse/outbound/create', 'outbound'],
    ['/warehouse/transfer-out/create', 'transfer'], ['/warehouse/scrap-apply/create', 'scrap'],
    ['/warehouse/zone/create', 'zone'], ['/warehouse/passage/create', 'passage'],
    ['/warehouse/shelf/create', 'shelf'], ['/warehouse/location/create', 'location'],
    ['/purchase/plan/create', 'purchase-plan'], ['/purchase/order/create', 'purchase-order'],
    ['/sales/order/create', 'sales-order'], ['/sales/pre-order/create', 'pre-order'],
    ['/sales/quotation/create', 'quotation'], ['/sales/shipment/create', 'shipment'],
    ['/quality/inspection/create', 'inspection'],
  ]) {
    test(`${label} — no500`, async ({ page }) => {
      await page.goto(`${BASE}${path}`); await page.waitForTimeout(1500);
      expect(await page.locator('button:has-text("保存")').count(), `no save btn in ${label}`).toBeGreaterThan(0);
      // Fill any first text-like input
      const inp = page.locator('input:not([disabled]):not([readonly]):not([type="checkbox"]):not([type="radio"]):not([type="number"]):not([type="date"])').first();
      if (await inp.count() > 0) await inp.fill(`T-${Date.now()}`);
      await page.locator('button:has-text("保存")').click();
      await page.waitForTimeout(2000);
      await expect.poll(() => page.locator('text=Internal server error').count(), { timeout: 5000 }).toBe(0);
    });
  }
});
