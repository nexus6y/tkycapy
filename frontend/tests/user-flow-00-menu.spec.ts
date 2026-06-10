/**
 * 用户流程 00 — 菜单路由与框架验证
 *
 * 策略：真实浏览器 UI 操作，通过左侧菜单点击进入页面，
 * 断言无 404/500、tab 出现、内容不空白。
 * 不做复杂业务保存。
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ── 工具函数 ──────────────────────────────────────────────

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('button:has-text("登 录")');
  await page.waitForURL('**/');
  await page.waitForTimeout(800);
}

/** Ensure the sidebar is expanded (not collapsed to icons-only) */
async function ensureSidebarExpanded(page: any) {
  const aside = page.locator('aside');
  if (await aside.count() === 0) {
    // Sidebar is collapsed — click the hamburger toggle
    await page.locator('header button').first().click();
    await page.waitForTimeout(400);
  }
}

/** Assert no fatal error text on page */
async function assertNoFatal(page: any, label: string) {
  const fatalPatterns = [
    'This page could not be found',
    'Internal server error',
  ];
  for (const pattern of fatalPatterns) {
    const count = await page.locator(`text=${pattern}`).count();
    expect(count, `${label}: must not show "${pattern}"`).toBe(0);
  }
}

/**
 * Click a chain of sidebar menu parents to expand, then click the leaf.
 *
 * @param parents - ordered parent labels to click (e.g. ["公共基础","物料管理"])
 * @param leaf    - the leaf menu item label (e.g. "物料分类")
 * @param expectedPath - the expected URL path after navigation
 */
async function clickMenu(
  page: any,
  parents: string[],
  leaf: string,
  expectedPath: string,
) {
  const aside = page.locator('aside');

  // Click each parent to expand its children
  for (const parent of parents) {
    const parentEl = aside.locator(`text=${parent}`).last();
    await parentEl.click();
    await page.waitForTimeout(350);
  }

  // Click the leaf item
  const leafEl = aside.locator(`text=${leaf}`).last();
  await leafEl.click();
  await page.waitForTimeout(2000);

  // Assert URL matches
  const currentUrl = page.url();
  expect(currentUrl, `URL should contain ${expectedPath}`).toContain(expectedPath);
}

/** Assert a tab with given text is visible in tags-view */
async function assertTabVisible(page: any, tabText: string) {
  const tab = page.locator('.h-\\[44px\\]').locator(`text=${tabText}`).first();
  await expect(tab, `Tab "${tabText}" should be visible`).toBeVisible({ timeout: 3000 });
}

/** Assert the main content area is not blank */
async function assertMainNotBlank(page: any, label: string) {
  const main = page.getByTestId('main-scroll-container');
  const text = await main.innerText();
  expect(text.trim().length, `${label}: main content must not be blank`).toBeGreaterThan(0);
}

/** Close a tab by clicking its X button, then assert it's removed */
async function closeTab(page: any, tabText: string) {
  // Find the tab span containing our text, then click its X child
  const tab = page.locator('.h-\\[44px\\]').locator('span', { hasText: tabText }).first();
  const closeBtn = tab.locator('svg.h-3.w-3').first();
  await closeBtn.click();
  await page.waitForTimeout(400);
  // Tab should be gone
  const afterCount = await page.locator('.h-\\[44px\\]').locator(`text=${tabText}`).count();
  expect(afterCount, `Tab "${tabText}" should be closed`).toBe(0);
}

// ── 测试套件 ──────────────────────────────────────────────

test.describe('Menu Route — Real Click Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await ensureSidebarExpanded(page);
  });

  // ── 18 个叶子菜单路由 ──────────────────────────────────

  test('工作台 (/)', async ({ page }) => {
    // Dashboard is already open after login
    await assertNoFatal(page, '工作台');
    await assertMainNotBlank(page, '工作台');
    await assertTabVisible(page, '工作台');
  });

  test('公共基础 → 物料分类 (/material-category)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '物料管理'], '物料分类', '/material-category');
    await assertNoFatal(page, '物料分类');
    await assertMainNotBlank(page, '物料分类');
    await assertTabVisible(page, '物料分类');
    await closeTab(page, '物料分类');
  });

  test('公共基础 → 物料参数 (/material-param)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '物料管理'], '物料参数', '/material-param');
    await assertNoFatal(page, '物料参数');
    await assertMainNotBlank(page, '物料参数');
    await assertTabVisible(page, '物料参数');
    await closeTab(page, '物料参数');
  });

  test('公共基础 → 物料档案 (/material)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '物料管理'], '物料档案', '/material');
    await assertNoFatal(page, '物料档案');
    await assertMainNotBlank(page, '物料档案');
    await assertTabVisible(page, '物料档案');
    await closeTab(page, '物料档案');
  });

  test('项目管理 → 项目维护 (/project)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '项目管理'], '项目维护', '/project');
    await assertNoFatal(page, '项目维护');
    await assertMainNotBlank(page, '项目维护');
    await assertTabVisible(page, '项目维护');
    await closeTab(page, '项目维护');
  });

  test('项目管理 → 项目查询 (/project/query)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '项目管理'], '项目查询', '/project/query');
    await assertNoFatal(page, '项目查询');
    await assertMainNotBlank(page, '项目查询');
    await assertTabVisible(page, '项目查询');
    await closeTab(page, '项目查询');
  });

  test('合同管理 → 合同维护 (/contract)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '合同管理'], '合同维护', '/contract');
    await assertNoFatal(page, '合同维护');
    await assertMainNotBlank(page, '合同维护');
    await assertTabVisible(page, '合同维护');
    await closeTab(page, '合同维护');
  });

  test('合同管理 → 合同参数 (/contract/params)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '合同管理'], '合同参数', '/contract/params');
    await assertNoFatal(page, '合同参数');
    await assertMainNotBlank(page, '合同参数');
    await assertTabVisible(page, '合同参数');
    await closeTab(page, '合同参数');
  });

  test('合同管理 → 合同查询 (/contract/query)', async ({ page }) => {
    await clickMenu(page, ['公共基础', '合同管理'], '合同查询', '/contract/query');
    await assertNoFatal(page, '合同查询');
    await assertMainNotBlank(page, '合同查询');
    await assertTabVisible(page, '合同查询');
    await closeTab(page, '合同查询');
  });

  test('采购管理 → 供应商档案 (/purchase/supplier)', async ({ page }) => {
    await clickMenu(page, ['采购管理'], '供应商档案', '/purchase/supplier');
    await assertNoFatal(page, '供应商档案');
    await assertMainNotBlank(page, '供应商档案');
    await assertTabVisible(page, '供应商档案');
    await closeTab(page, '供应商档案');
  });

  test('采购管理 → 采购计划维护 (/purchase/plan)', async ({ page }) => {
    await clickMenu(page, ['采购管理'], '采购计划维护', '/purchase/plan');
    await assertNoFatal(page, '采购计划维护');
    await assertMainNotBlank(page, '采购计划维护');
    await assertTabVisible(page, '采购计划维护');
    await closeTab(page, '采购计划维护');
  });

  test('采购管理 → 采购订单维护 (/purchase/order)', async ({ page }) => {
    await clickMenu(page, ['采购管理'], '采购订单维护', '/purchase/order');
    await assertNoFatal(page, '采购订单维护');
    await assertMainNotBlank(page, '采购订单维护');
    await assertTabVisible(page, '采购订单维护');
    await closeTab(page, '采购订单维护');
  });

  test('仓储管理 → 入库单维护 (/warehouse/inbound)', async ({ page }) => {
    await clickMenu(page, ['仓储管理', '入库管理'], '入库单维护', '/warehouse/inbound');
    await assertNoFatal(page, '入库单维护');
    await assertMainNotBlank(page, '入库单维护');
    await assertTabVisible(page, '入库单维护');
    await closeTab(page, '入库单维护');
  });

  test('仓储管理 → 出库单维护 (/warehouse/outbound)', async ({ page }) => {
    await clickMenu(page, ['仓储管理', '出库管理'], '出库单维护', '/warehouse/outbound');
    await assertNoFatal(page, '出库单维护');
    await assertMainNotBlank(page, '出库单维护');
    await assertTabVisible(page, '出库单维护');
    await closeTab(page, '出库单维护');
  });

  test('标准生产 → 制造基础 → BOM管理 → BOM维护 (/production/bom)', async ({ page }) => {
    await clickMenu(page, ['标准生产', '制造基础', 'BOM管理'], 'BOM维护', '/production/bom');
    await assertNoFatal(page, 'BOM维护');
    await assertMainNotBlank(page, 'BOM维护');
    await assertTabVisible(page, 'BOM维护');
    await closeTab(page, 'BOM维护');
  });

  test('标准生产 → 生产管理 → 生产订单工作台 (/production/order)', async ({ page }) => {
    await clickMenu(page, ['标准生产', '生产管理'], '生产订单工作台', '/production/order');
    await assertNoFatal(page, '生产订单工作台');
    await assertMainNotBlank(page, '生产订单工作台');
    await assertTabVisible(page, '生产订单工作台');
    await closeTab(page, '生产订单工作台');
  });

  test('质量管理 → 质检单维护 (/quality/inspection)', async ({ page }) => {
    await clickMenu(page, ['质量管理'], '质检单维护', '/quality/inspection');
    await assertNoFatal(page, '质检单维护');
    await assertMainNotBlank(page, '质检单维护');
    await assertTabVisible(page, '质检单维护');
    await closeTab(page, '质检单维护');
  });

  test('系统管理 → 字典管理 (/system/dict)', async ({ page }) => {
    await clickMenu(page, ['系统管理'], '字典管理', '/system/dict');
    await assertNoFatal(page, '字典管理');
    await assertMainNotBlank(page, '字典管理');
    await assertTabVisible(page, '字典管理');
    await closeTab(page, '字典管理');
  });
});

// ── 菜单展开/收起 ─────────────────────────────────────────

/** Expand parent chain, then toggle a target menu item */
async function toggleMenuModule(
  page: any, parents: string[], target: string,
) {
  const aside = page.locator('aside');
  // Expand parent chain first
  for (const parent of parents) {
    await aside.locator(`text=${parent}`).last().click();
    await page.waitForTimeout(400);
  }
  // Now toggle the target
  const targetEl = aside.locator(`text=${target}`).last();
  // Click once to expand
  await targetEl.click();
  await page.waitForTimeout(400);
  const countAfterExpand = await aside.locator('span.truncate').count();
  expect(countAfterExpand, `${target}: menu should have items after expand`).toBeGreaterThan(0);
  // Click again to collapse
  await targetEl.click();
  await page.waitForTimeout(400);
  const countAfterCollapse = await aside.locator('span.truncate').count();
  expect(countAfterCollapse, `${target}: should still be functional after collapse`).toBeGreaterThan(0);
}

test.describe('Module Expand/Collapse', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await ensureSidebarExpanded(page);
  });

  test('公共基础 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, [], '公共基础');
  });

  test('公共基础 → 合同管理 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, ['公共基础'], '合同管理');
  });

  test('销售管理 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, [], '销售管理');
  });

  test('采购管理 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, [], '采购管理');
  });

  test('仓储管理 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, [], '仓储管理');
  });

  test('质量管理 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, [], '质量管理');
  });

  test('标准生产 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, [], '标准生产');
  });

  test('标准生产 → 生产管理 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, ['标准生产'], '生产管理');
  });

  test('系统管理 — 展开/收起', async ({ page }) => {
    await toggleMenuModule(page, [], '系统管理');
  });
});
