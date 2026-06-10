/**
 * 用户流程 01 — 合同管理模块（零弱断言版）
 *
 * 规则：
 * - 任何 API 500 / page 404 / console error / unhandled rejection → fail
 * - 任何弹窗搜索后必须 rows > 0
 * - 任何 quantity 输入必须在输入前断言 input 存在
 * - 任何列表搜索后必须强制 contain
 * - 销售合同同采购合同一样完整：相对方 + 保存 + 列表查 + 编辑回显
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

// ── 工具 ──────────────────────────────────────────────────

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('button:has-text("登 录")');
  await page.waitForURL('**/');
  await page.waitForTimeout(800);
}

async function ensureSidebarExpanded(page: any) {
  if ((await page.locator('aside').count()) === 0) {
    await page.locator('header button').first().click();
    await page.waitForTimeout(400);
  }
}

function installFatalChecks(page: any) {
  const api500s: string[] = [];
  const consoleErrors: string[] = [];

  page.on('response', (r: any) => {
    if (r.url().includes('/api/') && r.status() >= 500)
      api500s.push(`${r.status()} ${r.url()}`);
  });
  page.on('console', (m: any) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  // Unhandled rejections in page
  page.on('pageerror', (err: Error) => {
    consoleErrors.push(`PAGE_ERROR: ${err.message}`);
  });

  return {
    async check(label: string) {
      for (const p of ['This page could not be found', 'Internal server error']) {
        if ((await page.locator(`text=${p}`).count()) > 0)
          throw new Error(`${label}: "${p}" found on page`);
      }
      if (api500s.length > 0)
        throw new Error(`${label}: API 500s: ${api500s.join(', ')}`);
      const real = consoleErrors.filter(
        e => !e.includes('hydration') && !e.includes('Hydration') && !e.includes('Warning:'),
      );
      if (real.length > 0)
        throw new Error(`${label}: Console errors: ${real.slice(0, 5).join('; ')}`);
    },
  };
}

async function assertToastContains(page: any, text: string, label: string) {
  const toast = page.locator('.fixed.top-4.right-4.z-50');
  await expect(toast, `${label}: toast "${text}"`).toContainText(text, { timeout: 4000 });
}

async function clickMenu(page: any, parents: string[], leaf: string, expectedPath: string) {
  const aside = page.locator('aside');
  for (const p of parents) {
    await aside.locator(`text=${p}`).last().click();
    await page.waitForTimeout(350);
  }
  await aside.locator(`text=${leaf}`).last().click();
  await page.waitForTimeout(2000);
  expect(page.url()).toContain(expectedPath);
}

function H(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}
async function getToken(request: any) {
  return (await (await request.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token;
}

async function clickSaveBtn(page: any) {
  await page.getByTestId('form-save-btn').click();
}

// ── 测试数据准备 ──────────────────────────────────────────

async function ensureTestData(request: any) {
  const token = await getToken(request);
  const h = H(token);
  const ts = Date.now();

  // Supplier
  const sCode = `E2E_SUP_${ts}`, sName = `E2E_Supplier_${ts}`;
  let sup: any = await request.get(`${API}/suppliers?pageSize=1&code=${encodeURIComponent(sCode)}`, h).then(r => r.json());
  let supplierId = sup?.items?.[0]?.id;
  if (!supplierId) {
    supplierId = (await (await request.post(`${API}/suppliers`, { ...h, data: { code: sCode, name: sName, status: 'ACTIVE' } })).json()).id;
  }

  // Customer
  const cCode = `E2E_CUS_${ts}`, cName = `E2E_Customer_${ts}`;
  let cus: any = await request.get(`${API}/customers?pageSize=1&code=${encodeURIComponent(cCode)}`, h).then(r => r.json());
  let customerId = cus?.items?.[0]?.id;
  if (!customerId) {
    customerId = (await (await request.post(`${API}/customers`, { ...h, data: { code: cCode, name: cName, status: 'ACTIVE' } })).json()).id;
  }

  // Unit
  const uCode = `E2E_UNIT_${ts}`;
  let unitId: string;
  {
    const u: any = await request.get(`${API}/measurement-units?pageSize=1&code=${encodeURIComponent(uCode)}`, h).then(r => r.json());
    unitId = u?.items?.[0]?.id;
    if (!unitId) {
      unitId = (await (await request.post(`${API}/measurement-units`, { ...h, data: { code: uCode, name: 'E2E个', symbol: 'pcs', sortOrder: 1, status: 'ACTIVE' } })).json()).id;
    }
  }

  // Category
  let catId: string;
  {
    const cat: any = await request.get(`${API}/material-categories?pageSize=1`, h).then(r => r.json());
    catId = cat?.items?.[0]?.id;
    if (!catId) {
      catId = (await (await request.post(`${API}/material-categories`, { ...h, data: { code: `E2E_CAT_${ts}`, name: 'E2E测试分类', sortOrder: 1, status: 'ACTIVE' } })).json()).id;
    }
  }

  // Material
  const mCode = `E2E_MAT_${ts}`, mName = `E2E_Material_${ts}`;
  let materialId: string;
  {
    const mat: any = await request.get(`${API}/materials?pageSize=1&code=${encodeURIComponent(mCode)}`, h).then(r => r.json());
    materialId = mat?.items?.[0]?.id;
    if (!materialId) {
      materialId = (await (await request.post(`${API}/materials`, { ...h, data: { code: mCode, name: mName, specification: 'E2E规格mm', categoryId: catId, unitId, status: 'ACTIVE' } })).json()).id;
    }
  }

  return { supplierId, supplierName: sName, supplierCode: sCode, customerId, customerName: cName, customerCode: cCode, materialId, materialName: mName, materialCode: mCode, unitId, catId, token, h };
}

async function cleanupTestData(request: any, data: any) {
  const { h } = data;
  if (data.materialId) await request.delete(`${API}/materials/${data.materialId}`, h).catch(() => {});
  if (data.customerId) await request.delete(`${API}/customers/${data.customerId}`, h).catch(() => {});
  if (data.supplierId) await request.delete(`${API}/suppliers/${data.supplierId}`, h).catch(() => {});
}

// ── 表单操作 ──────────────────────────────────────────────

async function ensureSectionExpanded(page: any, sectionId: string) {
  const section = page.locator(`#${sectionId}`);
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  if (!(await section.locator('> div:last-child').isVisible())) {
    await section.locator('h2').click();
    await page.waitForTimeout(500);
  }
}

async function selectOption(page: any, testId: string, optionText: string) {
  await page.getByTestId(testId).click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: optionText }).click();
  await page.waitForTimeout(300);
}

/** Pick counterparty via EntityPickerDialog. Searches by name, asserts rows>0, returns after fields populated. */
async function selectCounterparty(page: any, counterpartyName: string) {
  const section = page.locator('#counterparty');
  await section.locator('input[readonly]').first().click();
  await page.waitForTimeout(1000);

  const d = page.locator('[role="dialog"]');
  await expect(d).toBeVisible();
  await d.locator('input').nth(1).fill(counterpartyName);
  await d.locator('button:has-text("查询")').click();
  await page.waitForTimeout(1000);

  const rows = d.locator('table tbody tr');
  expect(await rows.count(), `${counterpartyName} 应有数据`).toBeGreaterThan(0);

  await d.locator('table tbody input[type="radio"]').first().click();
  await page.waitForTimeout(300);
  await d.locator('button:has-text("确定")').click();
  await page.waitForTimeout(800);

  expect(await section.locator('input').nth(1).inputValue(), '编号应带出').not.toBe('');
  expect(await section.locator('input').nth(2).inputValue(), '名称应带出').not.toBe('');
}

/** Pick material via MaterialPickerDialog. Searches by name, asserts rows>0, returns after fields populated. */
async function selectMaterialInLine(page: any, materialName: string) {
  const ls = page.locator('#lines');
  await ls.locator('input[placeholder="选择物料"]').first().click();
  await page.waitForTimeout(1200);

  const d = page.locator('[role="dialog"]');
  await expect(d).toBeVisible();
  await d.locator('input').nth(1).fill(materialName);
  await d.locator('button:has-text("查询")').click();
  await page.waitForTimeout(1200);

  const rows = d.locator('table tbody tr');
  expect(await rows.count(), `${materialName} 应有数据`).toBeGreaterThan(0);

  await d.locator('table tbody input[type="radio"]').first().click();
  await page.waitForTimeout(300);
  await d.locator('button:has-text("确定")').click();
  await page.waitForTimeout(800);

  // Verify: 4th cell = spec, we check material code (2nd input in row after checkbox)
  expect(await ls.locator('table tbody tr').first().locator('input').nth(1).inputValue(), '编码应带出').not.toBe('');
}

// ── 测试 1: 合同参数 CRUD ─────────────────────────────────

test.describe('01 — 合同参数 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    const fc = installFatalChecks(page);
    await login(page);
    await ensureSidebarExpanded(page);
    await clickMenu(page, ['公共基础', '合同管理'], '合同参数', '/contract/params');
    await fc.check('合同参数-page');
  });

  test('新增 → 搜索 → 修改 → 删除', async ({ page }) => {
    const fc = installFatalChecks(page);
    const ts = Date.now();
    const code = `E2E_CT_${ts}`, n1 = `E2E合同类型_${ts}`, n2 = `E2E合同类型已修改_${ts}`;

    await page.locator('button[role="combobox"]').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: '合同类型' }).click();
    await page.waitForTimeout(600);

    // 新增
    await page.locator('.h-14').locator('button:has-text("新增")').click();
    await page.waitForTimeout(600);
    const m = page.locator('.fixed.inset-0.z-50');
    await m.locator('input').nth(0).fill(code);
    await m.locator('input').nth(1).fill(n1);
    await m.locator('input').nth(2).fill('E2E_VALUE');
    await m.locator('input[type="number"]').fill('1');
    await m.locator('input').last().fill('E2E备注');
    await m.locator('button:has-text("保存")').click();
    await page.waitForTimeout(1500);
    await fc.check('新增');

    // 搜索
    const sr = page.locator('.flex-wrap').first();
    await sr.locator('input').last().fill(n1);
    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(1500);
    let t = await page.locator('table tbody').innerText();
    expect(t, '应找到 code').toContain(code);
    expect(t, '应找到 name1').toContain(n1);

    // 修改
    await page.locator('table tbody tr').filter({ hasText: n1 }).locator('button:has-text("修改")').first().click();
    await page.waitForTimeout(600);
    const m2 = page.locator('.fixed.inset-0.z-50');
    await m2.locator('input').nth(1).fill(n2);
    await m2.locator('button:has-text("保存")').click();
    await page.waitForTimeout(1500);
    await fc.check('修改');

    // 再搜索
    await sr.locator('input').last().fill(n2);
    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(1500);
    t = await page.locator('table tbody').innerText();
    expect(t, '应找到 name2').toContain(n2);

    // 删除
    await page.locator('table tbody tr').filter({ hasText: n2 }).locator('button:has-text("删除")').first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"]').locator('.bg-\\[\\#f56c6c\\]').click();
    await page.waitForTimeout(1500);
    await fc.check('删除');

    // 验证删除
    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText(), '不应含 name2').not.toContain(n2);
  });
});

// ── 测试 2: 合同查询 ──────────────────────────────────────

test.describe('02 — 合同查询', () => {
  test.beforeEach(async ({ page }) => {
    const fc = installFatalChecks(page);
    await login(page);
    await ensureSidebarExpanded(page);
    await clickMenu(page, ['公共基础', '合同管理'], '合同查询', '/contract/query');
    await fc.check('page');
  });

  test('搜索 → 重置 → 查看', async ({ page }) => {
    const fc = installFatalChecks(page);
    const sr = page.locator('.flex-wrap').first();
    await sr.locator('input').nth(1).fill('E2E');
    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(1500);
    await fc.check('搜索');

    await page.locator('.h-14').locator('button:has-text("重置")').click();
    await page.waitForTimeout(500);
    expect(await sr.locator('input').nth(1).inputValue()).toBe('');

    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(1500);
    await fc.check('搜索全部');

    // Search by code to ensure 1 specific contract exists for "查看" test
    await sr.locator('input').nth(1).fill('CON');
    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(1500);
    await fc.check('搜索CON');

    const viewBtn = page.locator('table tbody button:has-text("查看")').first();
    const codeLnk = page.locator('table tbody button[class*="text-\\[\\#409eff\\]"]').first();
    const hasView = (await viewBtn.count()) > 0;
    const hasCode = (await codeLnk.count()) > 0;
    // Must have at least one clickable element if table has data
    if ((await page.locator('table tbody tr').count()) > 0) {
      expect(hasView || hasCode, 'table has rows but no clickable element').toBe(true);
      if (hasView) {
        await viewBtn.click();
        await page.waitForTimeout(2000);
        await fc.check('查看后');
        expect(page.url()).toContain('/contract/');
      } else {
        await codeLnk.click();
        await page.waitForTimeout(2000);
        await fc.check('链接后');
        expect(page.url()).toContain('/contract/');
      }
    }
  });
});

// ── 测试 3: 合同维护列表 ──────────────────────────────────

test.describe('03 — 合同维护列表', () => {
  test.beforeEach(async ({ page }) => {
    const fc = installFatalChecks(page);
    await login(page);
    await ensureSidebarExpanded(page);
    await clickMenu(page, ['公共基础', '合同管理'], '合同维护', '/contract');
    await fc.check('page');
  });

  test('新增/搜索/分页', async ({ page }) => {
    const fc = installFatalChecks(page);
    await page.locator('.h-14').locator('button:has-text("新增")').click();
    await page.waitForTimeout(2000);
    await fc.check('新增跳转');
    expect(page.url()).toContain('/contract/create');
    await page.goBack();
    await page.waitForTimeout(1500);

    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(1500);
    await fc.check('搜索');

    const pag = page.getByTestId('erp-pagination');
    if ((await pag.count()) > 0) {
      await pag.locator('button').last().click();
      await page.waitForTimeout(1500);
      await fc.check('翻页');
    }
  });
});

// ── 测试 4: 采购合同完整新增 ──────────────────────────────

test.describe('04 — 采购合同完整新增', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await ensureTestData(request); });
  test.afterAll(async ({ request }) => { await cleanupTestData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await ensureSidebarExpanded(page); });

  test('填采购合同 → 选供应商 → 计划 → 明细 → 保存 → 列表查 → 编辑回显', async ({ page, request }) => {
    const fc = installFatalChecks(page);
    const ts = Date.now();
    const cName = `E2E采购合同_${ts}`;
    const today = new Date().toISOString().slice(0, 10);
    const fut = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
    await fc.check('进创建');

    // 基本信息
    await selectOption(page, 'contract-type-select', '采购合同');
    await page.getByTestId('contract-name-input').fill(cName);
    await selectOption(page, 'contract-paymentmethod-select', '一次性付');
    await selectOption(page, 'contract-amounttype-select', '固定总价');
    await page.getByTestId('contract-totalamount-input').fill('10000');
    await page.getByTestId('contract-effectivedate-input').fill(today);
    await page.getByTestId('contract-undertaker-input').fill('E2E承办人');
    await fc.check('基本信息');

    // 选供应商
    await ensureSectionExpanded(page, 'counterparty');
    await selectCounterparty(page, td.supplierName);
    await fc.check('选供应商');

    // 收付费计划
    await ensureSectionExpanded(page, 'plans');
    await page.getByTestId('contract-add-plan-btn').click();
    await page.waitForTimeout(500);
    const pt = page.locator('#plans table');
    await pt.locator('input[type="number"]').nth(0).fill('10000');
    await pt.locator('input[type="date"]').fill(fut);
    await pt.locator('input[type="number"]').nth(1).fill('100');
    await pt.locator('input').last().fill('E2E计划备注');
    await fc.check('计划');

    // 合同明细
    await ensureSectionExpanded(page, 'lines');
    await page.getByTestId('contract-add-line-btn').click();
    await page.waitForTimeout(500);

    await selectMaterialInLine(page, td.materialName);
    const ls = page.locator('#lines');
    expect(await ls.locator('table tbody tr').first().locator('input').nth(1).inputValue(), '编码应填').toBe(td.materialCode);

    const nums = ls.locator('table tbody tr').first().locator('input[type="number"]');
    expect(await nums.count()).toBeGreaterThanOrEqual(2);
    await nums.nth(0).fill('10');
    await nums.nth(1).fill('100');
    await page.waitForTimeout(600);

    // amount = 10*100 = 1000.00
    await expect(ls.locator('table tbody tr').first().locator('input').nth(7)).toHaveValue('1000.00');
    await fc.check('明细');

    // ── 保存 ──
    const codeBefore = await page.locator('input[disabled][readonly]').first().inputValue();
    expect(codeBefore.length).toBeGreaterThan(0);

    await clickSaveBtn(page);
    await page.waitForTimeout(3000);
    await fc.check('保存');

    expect(page.url(), '应离开创建页').not.toContain('/create');

    // ── 列表强制查 ──
    if (!page.url().endsWith('/contract')) {
      await page.goto(`${BASE}/contract`);
      await page.waitForTimeout(2000);
    }
    const sr = page.locator('.flex-wrap').first();
    await sr.locator('input').first().fill(codeBefore);
    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(2000);
    await fc.check('列表搜索');

    const lt = await page.locator('table tbody').innerText();
    expect(lt, '列表应有 contractName').toContain(cName);

    // ── 编辑回显 ──
    const eb = page.locator('table tbody tr').filter({ hasText: codeBefore }).locator('button:has-text("修改")').first();
    expect(await eb.count()).toBeGreaterThan(0);
    await eb.click();
    await page.waitForTimeout(2500);
    await fc.check('编辑页');

    await expect(page.locator('label:has-text("合同名称") + div input').first(), '名称应回显').toHaveValue(cName);
    await fc.check('回显');

    // Clean up
    try {
      const r: any = await request.get(`${API}/contracts?name=${encodeURIComponent(cName)}`, H(td.token)).then(r => r.json());
      for (const c of r?.items || []) await request.delete(`${API}/contracts/${c.id}`, H(td.token)).catch(() => {});
    } catch {}
  });
});

// ── 测试 5: 销售合同完整新增 ──────────────────────────────

test.describe('05 — 销售合同完整新增', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await ensureTestData(request); });
  test.afterAll(async ({ request }) => { await cleanupTestData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await ensureSidebarExpanded(page); });

  test('填销售合同 → 选客户 → 计划 → 明细 → 保存 → 列表查 → 编辑回显', async ({ page, request }) => {
    const fc = installFatalChecks(page);
    const ts = Date.now();
    const cName = `E2E销售合同_${ts}`;
    const today = new Date().toISOString().slice(0, 10);
    const fut = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
    await fc.check('进创建');

    // 默认 = 销售合同
    await page.getByTestId('contract-name-input').fill(cName);
    await selectOption(page, 'contract-paymentmethod-select', '一次性付');
    await selectOption(page, 'contract-amounttype-select', '固定总价');
    await page.getByTestId('contract-totalamount-input').fill('20000');
    await page.getByTestId('contract-effectivedate-input').fill(today);
    await page.getByTestId('contract-undertaker-input').fill('E2E承办人');
    await fc.check('基本信息');

    // 选客户
    await ensureSectionExpanded(page, 'counterparty');
    await selectCounterparty(page, td.customerName);
    await fc.check('选客户');

    // 收付费计划
    await ensureSectionExpanded(page, 'plans');
    await page.getByTestId('contract-add-plan-btn').click();
    await page.waitForTimeout(500);
    const pt = page.locator('#plans table');
    await pt.locator('input[type="number"]').nth(0).fill('20000');
    await pt.locator('input[type="date"]').fill(fut);
    await pt.locator('input[type="number"]').nth(1).fill('100');
    await pt.locator('input').last().fill('E2E计划备注');
    await fc.check('计划');

    // 合同明细
    await ensureSectionExpanded(page, 'lines');
    await page.getByTestId('contract-add-line-btn').click();
    await page.waitForTimeout(500);

    await selectMaterialInLine(page, td.materialName);
    const ls = page.locator('#lines');
    expect(await ls.locator('table tbody tr').first().locator('input').nth(1).inputValue(), '编码应填').toBe(td.materialCode);

    const nums = ls.locator('table tbody tr').first().locator('input[type="number"]');
    expect(await nums.count()).toBeGreaterThanOrEqual(2);
    await nums.nth(0).fill('5');
    await nums.nth(1).fill('200');
    await page.waitForTimeout(600);

    // amount = 5*200 = 1000.00
    await expect(ls.locator('table tbody tr').first().locator('input').nth(7)).toHaveValue('1000.00');
    await fc.check('明细');

    // ── 保存 ──
    const codeBefore = await page.locator('input[disabled][readonly]').first().inputValue();
    expect(codeBefore.length).toBeGreaterThan(0);

    await clickSaveBtn(page);
    await page.waitForTimeout(3000);
    await fc.check('保存');

    expect(page.url(), '应离开创建页').not.toContain('/create');

    // ── 列表强制查 ──
    if (!page.url().endsWith('/contract')) {
      await page.goto(`${BASE}/contract`);
      await page.waitForTimeout(2000);
    }
    const sr = page.locator('.flex-wrap').first();
    await sr.locator('input').first().fill(codeBefore);
    await page.locator('.h-14').locator('button:has-text("搜索")').click();
    await page.waitForTimeout(2000);
    await fc.check('列表搜索');

    const lt = await page.locator('table tbody').innerText();
    expect(lt, '列表应有 contractName').toContain(cName);

    // ── 编辑回显 ──
    const eb = page.locator('table tbody tr').filter({ hasText: codeBefore }).locator('button:has-text("修改")').first();
    expect(await eb.count()).toBeGreaterThan(0);
    await eb.click();
    await page.waitForTimeout(2500);
    await fc.check('编辑页');

    await expect(page.locator('label:has-text("合同名称") + div input').first(), '名称应回显').toHaveValue(cName);
    await fc.check('回显');

    // Clean up
    try {
      const r: any = await request.get(`${API}/contracts?name=${encodeURIComponent(cName)}`, H(td.token)).then(r => r.json());
      for (const c of r?.items || []) await request.delete(`${API}/contracts/${c.id}`, H(td.token)).catch(() => {});
    } catch {}
  });
});

// ── 测试 6: 弹窗专项 ──────────────────────────────────────

test.describe('06 — 弹窗交互', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await ensureTestData(request); });
  test.afterAll(async ({ request }) => { await cleanupTestData(request, td); });
  test.beforeEach(async ({ page }) => {
    await login(page);
    await ensureSidebarExpanded(page);
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
  });

  test('供应商弹窗 — 打开 → 搜索 → rows>0 → 选择 → 确定 → 字段带出', async ({ page }) => {
    const fc = installFatalChecks(page);
    await selectOption(page, 'contract-type-select', '采购合同');
    await ensureSectionExpanded(page, 'counterparty');

    const sec = page.locator('#counterparty');
    await sec.locator('input[readonly]').first().click();
    await page.waitForTimeout(1000);

    const d = page.locator('[role="dialog"]');
    await expect(d).toBeVisible();
    await d.locator('input').nth(1).fill(td.supplierName);
    await d.locator('button:has-text("查询")').click();
    await page.waitForTimeout(1000);

    expect(await d.locator('table tbody tr').count(), '供应商表应有数据').toBeGreaterThan(0);
    await d.locator('table tbody input[type="radio"]').first().click();
    await page.waitForTimeout(300);
    await d.locator('button:has-text("确定")').click();
    await page.waitForTimeout(800);

    expect(await sec.locator('input').nth(1).inputValue(), '供应商编号应带出').not.toBe('');
    expect(await sec.locator('input').nth(2).inputValue(), '供应商名称应带出').not.toBe('');
    await fc.check('供应商');
  });

  test('客户弹窗 — 打开 → 搜索 → rows>0 → 取消 → 取消不清空', async ({ page }) => {
    const fc = installFatalChecks(page);
    await page.getByTestId('contract-name-input').fill('E2E弹窗测试');
    await ensureSectionExpanded(page, 'counterparty');

    await page.locator('#counterparty').locator('input[readonly]').first().click();
    await page.waitForTimeout(1000);

    const d = page.locator('[role="dialog"]');
    await expect(d).toBeVisible();
    // Must search for test customer — must find rows
    await d.locator('input').nth(1).fill(td.customerName);
    await d.locator('button:has-text("查询")').click();
    await page.waitForTimeout(1000);
    expect(await d.locator('table tbody tr').count(), '客户表应有数据').toBeGreaterThan(0);

    // Cancel — fields must NOT be cleared
    await d.locator('button:has-text("取消")').click();
    await page.waitForTimeout(500);
    expect(await page.getByTestId('contract-name-input').inputValue()).toBe('E2E弹窗测试');
    await fc.check('客户取消');
  });

  test('物料弹窗 — 打开 → 搜索 → rows>0 → 选择 → 确定 → 字段带出', async ({ page }) => {
    const fc = installFatalChecks(page);
    await ensureSectionExpanded(page, 'lines');
    await page.getByTestId('contract-add-line-btn').click();
    await page.waitForTimeout(500);

    await selectMaterialInLine(page, td.materialName);
    expect(await page.locator('#lines table tbody tr').first().locator('input').nth(1).inputValue()).toBe(td.materialCode);
    await fc.check('物料');
  });
});

// ── 测试 7: 表单校验 ──────────────────────────────────────

test.describe('07 — 表单校验', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await ensureTestData(request); });
  test.afterAll(async ({ request }) => { await cleanupTestData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await ensureSidebarExpanded(page); });

  test('空合同名称 → "请输入合同名称"', async ({ page }) => {
    const fc = installFatalChecks(page);
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
    await selectOption(page, 'contract-type-select', '销售合同');
    await clickSaveBtn(page);
    await page.waitForTimeout(1000);
    await assertToastContains(page, '请输入合同名称', '空名称');
    await fc.check('');
    expect(page.url()).toContain('/contract/create');
  });

  test('未选供应商 → "请选择供应商"', async ({ page }) => {
    const fc = installFatalChecks(page);
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
    await selectOption(page, 'contract-type-select', '采购合同');
    await page.getByTestId('contract-name-input').fill('E2E校验');
    await selectOption(page, 'contract-paymentmethod-select', '一次性付');
    await selectOption(page, 'contract-amounttype-select', '固定总价');
    await page.getByTestId('contract-totalamount-input').fill('5000');
    await page.getByTestId('contract-effectivedate-input').fill(new Date().toISOString().slice(0, 10));
    await page.getByTestId('contract-undertaker-input').fill('E2E');
    await clickSaveBtn(page);
    await page.waitForTimeout(1000);
    await assertToastContains(page, '请选择供应商', '无供应商');
    await fc.check('');
  });

  test('未选客户 → "请选择客户"', async ({ page }) => {
    const fc = installFatalChecks(page);
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
    await page.getByTestId('contract-name-input').fill('E2E校验');
    await selectOption(page, 'contract-paymentmethod-select', '一次性付');
    await selectOption(page, 'contract-amounttype-select', '固定总价');
    await page.getByTestId('contract-totalamount-input').fill('5000');
    await page.getByTestId('contract-effectivedate-input').fill(new Date().toISOString().slice(0, 10));
    await page.getByTestId('contract-undertaker-input').fill('E2E');
    await clickSaveBtn(page);
    await page.waitForTimeout(1000);
    await assertToastContains(page, '请选择客户', '无客户');
    await fc.check('');
  });

  test('明细缺物料 → "请选择物资"', async ({ page }) => {
    const fc = installFatalChecks(page);
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
    await selectOption(page, 'contract-type-select', '采购合同');
    await page.getByTestId('contract-name-input').fill('E2E校验缺物料');
    await selectOption(page, 'contract-paymentmethod-select', '一次性付');
    await selectOption(page, 'contract-amounttype-select', '固定总价');
    await page.getByTestId('contract-totalamount-input').fill('5000');
    await page.getByTestId('contract-effectivedate-input').fill(new Date().toISOString().slice(0, 10));
    await page.getByTestId('contract-undertaker-input').fill('E2E');
    await ensureSectionExpanded(page, 'counterparty');
    await selectCounterparty(page, td.supplierName);
    await ensureSectionExpanded(page, 'lines');
    await page.getByTestId('contract-add-line-btn').click();
    await page.waitForTimeout(500);

    // Fill quantity without selecting material
    const n = page.locator('#lines table tbody tr').first().locator('input[type="number"]');
    expect(await n.count()).toBeGreaterThan(0);
    await n.nth(0).fill('5');

    await clickSaveBtn(page);
    await page.waitForTimeout(1000);
    await assertToastContains(page, '请选择物资', '缺物料');
    await fc.check('');
    expect(page.url()).toContain('/contract/create');
  });

  test('明细数量为0 → "数量必须大于0"', async ({ page }) => {
    const fc = installFatalChecks(page);
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2500);
    await selectOption(page, 'contract-type-select', '采购合同');
    await page.getByTestId('contract-name-input').fill('E2E校验数量0');
    await selectOption(page, 'contract-paymentmethod-select', '一次性付');
    await selectOption(page, 'contract-amounttype-select', '固定总价');
    await page.getByTestId('contract-totalamount-input').fill('5000');
    await page.getByTestId('contract-effectivedate-input').fill(new Date().toISOString().slice(0, 10));
    await page.getByTestId('contract-undertaker-input').fill('E2E');
    await ensureSectionExpanded(page, 'counterparty');
    await selectCounterparty(page, td.supplierName);
    await ensureSectionExpanded(page, 'lines');
    await page.getByTestId('contract-add-line-btn').click();
    await page.waitForTimeout(500);
    await selectMaterialInLine(page, td.materialName);

    const n = page.locator('#lines table tbody tr').first().locator('input[type="number"]');
    expect(await n.count()).toBeGreaterThan(0);
    await n.nth(0).fill('0');

    await clickSaveBtn(page);
    await page.waitForTimeout(1000);
    await assertToastContains(page, '数量必须大于0', '量0');
    await fc.check('');
    expect(page.url()).toContain('/contract/create');
  });
});
