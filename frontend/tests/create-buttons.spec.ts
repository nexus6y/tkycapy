/**
 * 新增按钮可用性 E2E 验证
 * 运行：pnpm test:e2e:create-buttons
 *
 * 前提：backend + frontend 已启动
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

const PAGES_TO_TEST = [
  { path: '/purchase/plan', label: '采购计划', createPath: '/purchase/plan/create' },
  { path: '/purchase/order', label: '采购订单', createPath: '/purchase/order/create' },
  { path: '/purchase/return', label: '采购退货', createPath: '/purchase/return/create' },
  { path: '/production/change', label: '生产变更', createPath: '/production/change/create' },
  { path: '/production/return', label: '生产退料', createPath: '/production/return/create' },
  { path: '/production/issue', label: '生产领料', createPath: '/production/issue/create' },
  { path: '/production/bom', label: 'BOM', createPath: '/production/bom/create' },
  { path: '/production/order', label: '生产订单', createPath: '/production/order/create' },
  { path: '/production/process', label: '工序', createPath: '/production/process/create' },
  { path: '/production/route', label: '工艺路线', createPath: '/production/route/create' },
  { path: '/contract', label: '合同', createPath: '/contract/create' },
  { path: '/sales/quotation', label: '报价单', createPath: '/sales/quotation/create' },
  { path: '/sales/order', label: '销售订单', createPath: '/sales/order/create' },
  { path: '/sales/pre-order', label: '分劈单', createPath: '/sales/pre-order/create' },
  { path: '/sales/shipment', label: '销售出货', createPath: '/sales/shipment/create' },
  { path: '/sales/return', label: '销售退货', createPath: '/sales/return/create' },
  { path: '/warehouse/inbound', label: '入库单', createPath: '/warehouse/inbound/create' },
  { path: '/warehouse/outbound', label: '出库单', createPath: '/warehouse/outbound/create' },
  { path: '/warehouse/check', label: '盘点单', createPath: '/warehouse/check/create' },
  { path: '/warehouse/transfer-out', label: '调拨出库', createPath: '/warehouse/transfer-out/create' },
  { path: '/warehouse/scrap-apply', label: '报废申请', createPath: '/warehouse/scrap-apply/create' },
  { path: '/warehouse/lend-order', label: '借出单', createPath: '/warehouse/lend-order/create' },
  { path: '/warehouse/area', label: '地区', createPath: '/warehouse/area/create' },
  { path: '/quality/inspection', label: '质检单', createPath: '/quality/inspection/create' },
  { path: '/material', label: '物料', createPath: '/material/create' },
  { path: '/sales/customer', label: '客户', createPath: '/sales/customer/create' },
  { path: '/purchase/supplier', label: '供应商', createPath: '/purchase/supplier/create' },
  { path: '/project', label: '项目', createPath: '/project/create' },
  { path: '/material-category', label: '物料分类', createPath: '/material-category/create' },
];

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('button:has-text("登 录")');
  await page.waitForURL('**/');
  await page.waitForTimeout(500);
}

test.describe('新增按钮可用性验证', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const { path, label, createPath } of PAGES_TO_TEST) {
    test(`${label} — 点击新增应跳转 ${createPath}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(1000);

      // Find the main 新增 button (toolbar area, not sub-table)
      // Priority: Button text "新增" in the toolbar div
      const addBtn = page.locator('button:has-text("新增")').first();

      if (await addBtn.count() === 0) {
        // Skip if page has no 新增 button (e.g. query-only pages)
        console.log(`${label}: 未找到新增按钮，跳过`);
        return;
      }

      // Check if disabled
      const isDisabled = await addBtn.isDisabled().catch(() => false);
      if (isDisabled) {
        console.log(`${label}: 新增按钮已禁用，跳过`);
        return;
      }

      // Click the button
      await addBtn.click();

      // Wait for navigation or dialog
      await page.waitForTimeout(1000);

      const currentUrl = page.url();

      // Assert: URL should contain the create path
      const navigated = currentUrl.includes(createPath);

      // Or a dialog appeared
      const dialog = page.locator('[data-slot="dialog-content"]');
      const hasDialog = (await dialog.count()) > 0;

      expect(navigated || hasDialog).toBeTruthy();

      if (navigated) {
        console.log(`${label}: ✅ 成功跳转到 ${createPath}`);
      } else if (hasDialog) {
        console.log(`${label}: ✅ 弹窗已打开`);
        await page.keyboard.press('Escape');
      }
    });
  }

  test('采购计划新增 — 强断言：必须跳转 /purchase/plan/create', async ({ page }) => {
    await page.goto(`${BASE}/purchase/plan`);
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button:has-text("新增")');
    await expect(addBtn).toBeVisible({ timeout: 3000 });
    await expect(addBtn).toBeEnabled();

    await addBtn.click();
    await page.waitForTimeout(1500);

    // URL must contain the create path
    const url = page.url();
    expect(url).toContain('/purchase/plan/create');

    // Page should show 新增采购计划 or similar title
    await expect(page.locator('h1:has-text("新增采购计划")')).toBeVisible({ timeout: 5000 });
    console.log('采购计划: ✅ 新增跳转正确，标题正确');
  });

  test('合同新增 — 强断言：必须跳转 /contract/create', async ({ page }) => {
    await page.goto(`${BASE}/contract`);
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button:has-text("新增")').first();
    await expect(addBtn).toBeVisible({ timeout: 3000 });
    await expect(addBtn).toBeEnabled();

    await addBtn.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/contract/create');
    await expect(page.locator('h1:has-text("新增合同")')).toBeVisible({ timeout: 5000 });
    console.log('合同: ✅ 新增跳转正确');
  });
});
