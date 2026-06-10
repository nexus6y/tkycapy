/**
 * 布局滚动 & 分页不重叠 E2E
 *
 * 验证标准:
 * - 页面可纵向滚动
 * - 滚到底部时能完整看到最后一行
 * - 分页组件不遮挡任何数据行
 *
 * 使用稳定 data-testid 选择器，不依赖 CSS class 变化。
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

/** Verify a list page scrolls correctly and pagination does NOT overlap the last row */
async function verifyScroll(page: any, url: string, label: string) {
  await page.goto(`${BASE}${url}`);
  await page.waitForTimeout(3000);

  // 1. Check no 500 error
  const errCount = await page.locator('text=Internal server error').count();
  expect(errCount, `${label}: page loaded without 500 error`).toBe(0);

  // 2. Use stable test IDs — main scroll container + pagination
  const scrollContainer = page.getByTestId('main-scroll-container');
  const pagination = page.getByTestId('erp-pagination');
  const hasPagination = await pagination.count();

  // 3. Find table rows
  const rows = page.locator('table tbody tr');
  const rowCount = await rows.count();

  if (rowCount > 0) {
    // 4. Scroll down and verify it moved (page is scrollable)
    const beforeScroll = await scrollContainer.evaluate((el: HTMLElement) => el.scrollTop);
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);
    const afterScroll = await scrollContainer.evaluate((el: HTMLElement) => el.scrollTop);

    // 5. If enough rows to overflow, scroll position must change
    if (rowCount > 10) {
      expect(afterScroll, `${label}: scroll position should increase after mouse.wheel`).toBeGreaterThan(beforeScroll);
    }

    // 6. Scroll to bottom to check pagination overlap
    await scrollContainer.evaluate((el: HTMLElement) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(500);

    // 7. Verify pagination is in view and not overlapping the last row
    if (hasPagination > 0) {
      const lastRow = rows.last();
      const lastRowBox = await lastRow.boundingBox();
      const pagBox = await pagination.first().boundingBox();

      if (lastRowBox && pagBox) {
        // Pagination bottom must be below last row bottom → no overlap
        const lastRowBottom = lastRowBox.y + lastRowBox.height;
        const overlapY = pagBox.y < lastRowBottom;
        if (overlapY) {
          console.log(`${label}: LAST ROW y=${lastRowBox.y.toFixed(0)} h=${lastRowBox.height.toFixed(0)} bottom=${lastRowBottom.toFixed(0)}`);
          console.log(`${label}: PAGINATION y=${pagBox.y.toFixed(0)} h=${pagBox.height.toFixed(0)}`);
        }
        expect(overlapY, `${label}: pagination must NOT overlap last row (lastRow.bottom=${lastRowBottom.toFixed(0)}, pag.y=${pagBox.y.toFixed(0)})`).toBe(false);
      }

      // 8. Verify pagination has shrink-0 (not clipped)
      const pagDisplayed = await pagination.first().isVisible();
      expect(pagDisplayed, `${label}: pagination must be visible`).toBe(true);
    }
  }

  // 9. Main scroll container must exist
  const scVisible = await scrollContainer.isVisible();
  expect(scVisible, `${label}: main-scroll-container must be visible`).toBe(true);
}

test.describe('Layout Scroll & Pagination', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('contract 合同维护', async ({ page }) => {
    await verifyScroll(page, '/contract', 'contract');
  });

  test('material 物料档案', async ({ page }) => {
    await verifyScroll(page, '/material', 'material');
  });

  test('purchase/order 采购订单', async ({ page }) => {
    await verifyScroll(page, '/purchase/order', 'purchase/order');
  });

  test('warehouse/inbound 入库单', async ({ page }) => {
    await verifyScroll(page, '/warehouse/inbound', 'warehouse/inbound');
  });

  test('production/order 生产订单', async ({ page }) => {
    await verifyScroll(page, '/production/order', 'production/order');
  });

  test('sales/customer 客户档案', async ({ page }) => {
    await verifyScroll(page, '/sales/customer', 'sales/customer');
  });

  test('purchase/return 退供单', async ({ page }) => {
    await verifyScroll(page, '/purchase/return', 'purchase/return');
  });

  test('warehouse/location 货位', async ({ page }) => {
    await verifyScroll(page, '/warehouse/location', 'warehouse/location');
  });

  test('production/return 退料单', async ({ page }) => {
    await verifyScroll(page, '/production/return', 'production/return');
  });

  test('quality/inspection 质检单', async ({ page }) => {
    await verifyScroll(page, '/quality/inspection', 'quality/inspection');
  });
});
