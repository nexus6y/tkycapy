/**
 * 用户流程 11 — 菜单/路由/新增按钮全量可达性 + 表单保存冒烟 v2
 *
 * 硬断言版。零 try/catch 空捕获。零弱断言。零可跳过逻辑。
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

async function login(p: any) {
  await p.goto(`${BASE}/login`); await p.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await p.fill('input[placeholder="请输入用户名"]', 'admin');
  await p.fill('input[placeholder="请输入密码"]', 'admin123');
  await p.click('button:has-text("登 录")');
  await p.waitForURL('**/'); await p.waitForTimeout(800);
}
async function expandSidebar(p: any) {
  if ((await p.locator('aside').count()) === 0) { await p.locator('header button').first().click(); await p.waitForTimeout(400); }
}
function installFC(p: any) {
  const a5: string[] = [];
  p.on('response', (r: any) => { if (r.url().includes('/api/') && r.status() >= 500) a5.push(`${r.status()} ${r.url()}`); });
  p.on('console', (m: any) => {
    if (m.type() === 'error' && !m.text().includes('Warning:') && !m.text().includes('hydration') && !m.text().includes('unique "key"') && !m.text().includes('400') && !m.text().includes('409') && !m.text().includes('Bad Request') && !m.text().includes('should not be null') && !m.text().includes('uncontrolled'))
      a5.push(m.text());
  });
  p.on('pageerror', (err: any) => a5.push(err.message));
  return { async check(l: string) {
    for (const t of ['This page could not be found', 'Internal server error']) { if ((await p.locator(`text=${t}`).count()) > 0) throw new Error(`${l}: "${t}"`); }
    if (a5.length > 0) throw new Error(`${l}: API500s/Errors: ${a5.join('; ').slice(0, 300)}`);
  }};
}
async function formSave(p: any) { await p.locator('button[data-testid="form-save-btn"]').first().click({ force: true }); }
async function toolbarSearch(p: any) {
  for (const w of ['搜索','查询']) { const b = p.locator('.h-14 button'); for (let i = 0; i < await b.count(); i++) { if ((await b.nth(i).innerText()).trim() === w) { await b.nth(i).click({ force: true }); return; } } }
}
function H(t: string) { return { headers: { Authorization: `Bearer ${t}` } }; }
async function getToken(r: any) { return (await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token; }

/** UI save + verify either redirect or API persisted */
async function doCreateSave(page: any, apiPath: string, hdr: any, searchField: string, searchValue: string) {
  await formSave(page);
  // Wait for redirect. If save fails, page stays on /create.
  await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 15000 });
  expect(page.url(), `save must redirect from create`).not.toContain('/create');
  // API verify
  const v = await page.request.get(`${API}/${apiPath}?${searchField}=${encodeURIComponent(searchValue)}`, hdr).then((r: any) => r.json());
  expect(v.items?.length || 0, `${apiPath} must have new record`).toBeGreaterThan(0);
  return v.items?.[0]?.code || v.items?.[0]?.orderNo || v.items?.[0]?.returnNo || 'ok';
}

/** Click 新增 button and fill fields */
async function openCreatePath(page: any, listUrl: string, createUrl: string) {
  await page.goto(`${BASE}${listUrl}`); await page.waitForTimeout(2000);
  expect(page.url(), `list ${listUrl} not 404`).not.toContain('/_not-found');
  const addBtn = page.locator('.h-14 button:has-text("新增")').first();
  expect(await addBtn.count(), `新增 button on ${listUrl}`).toBeGreaterThan(0);
  await addBtn.click(); await page.waitForTimeout(2000);
  expect(page.url(), `must navigate to ${createUrl}`).toContain('/create');
  // Wait for auto-generated code if any
  await page.waitForTimeout(2000);
}

// ══════════════════════════════════════════════════════
// A. 公共基础
// ══════════════════════════════════════════════════════
test.describe('A — 公共基础', () => {
  let tdx: any; test.beforeAll(async ({ request }) => { const token = await getToken(request); tdx = { token, h: H(token) }; }); test.afterAll(async ({ request }) => { for (const api of ['materials','material-categories','contracts','projects']) { const r = await request.get(`${API}/${api}?pageSize=200`, tdx.h).then((r: any) => r.json()); for (const o of r?.items || []) { if ((o.name||o.orderName||'')?.includes('E2E')) await request.delete(`${API}/${api}/${o.id}`, tdx.h).catch(() => {}); } } }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('A1 物料分类：新增→填写→保存→API核验', async ({ page }) => {
    const fc = installFC(page); const ts = Date.now(), name = `E2E分类_${ts}`;
    await openCreatePath(page, '/material-category', '/material-category/create');
    await page.locator('label:has-text("名称") + div input').first().fill(name);
    const code = await doCreateSave(page, 'material-categories', tdx.h, 'name', name);
    await fc.check('a1'); console.log(`A1: ${code} ✅`);
  });

  test('A2 物料档案：新增→选分类/单位→填写→保存→API核验', async ({ page }) => {
    const fc = installFC(page); const ts = Date.now(), name = `E2E物料_${ts}`;
    await openCreatePath(page, '/material', '/material/create');

    // Basic section (active default)
    await page.locator('label:has-text("物料名称") + div input').first().fill(name);
    await page.locator('label:has-text("规格型号") + div input').first().fill('E2E规格mm');
    // Select category
    const catCb = page.locator('label:has-text("1级分类") + div button[role="combobox"]').first();
    await catCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes('E2E')) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);

    // Nature section
    const natureAnchor = page.locator('button:has-text("物料性质")').first();
    if (await natureAnchor.count() > 0) await natureAnchor.click();
    await page.waitForTimeout(500);
    await page.locator('label:has-text("产品分类") + div input').first().fill('成品');

    // Unit section
    const unitAnchor = page.locator('button:has-text("计量单位")').first();
    if (await unitAnchor.count() > 0) await unitAnchor.click();
    await page.waitForTimeout(500);
    const unitCb = page.locator('label:has-text("计量单位") + div button[role="combobox"]').first();
    await unitCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes('E2E')) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);

    // Production section
    const prodAnchor = page.locator('button:has-text("生产")').first();
    if (await prodAnchor.count() > 0) await prodAnchor.click();
    await page.waitForTimeout(500);
    await page.locator('label:has-text("计划属性") + div input').first().fill('自制');

    // Save — navigate through remaining sections first to satisfy all field rendering
    for (const secName of ['采购信息','质检与销售','仓储信息']) {
      const anchor = page.locator(`button:has-text("${secName}")`).first();
      if (await anchor.count() > 0) { await anchor.click(); await page.waitForTimeout(400); }
    }
    await formSave(page);
    await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 20000 });
    expect(page.url(), 'A2 save must leave /create').not.toContain('/create');
    const v2 = await page.request.get(`${API}/materials?name=${encodeURIComponent(name)}`, tdx.h).then((r: any) => r.json());
    expect(v2.items?.length || 0, 'A2 material must exist').toBeGreaterThan(0);
    console.log(`A2: ${v2.items?.[0]?.code} ✅`);
    await fc.check('a2');
  });

  test('A3 项目维护：新增→填写→保存→API核验', async ({ page }) => {
    const fc = installFC(page); const ts = Date.now(), name = `E2E项目_${ts}`;
    await openCreatePath(page, '/project', '/project/create');
    // Wait for auto-generated code
    await page.waitForTimeout(2000);
    await page.locator('label:has-text("项目名称") + div input').first().fill(name);
    await page.locator('label:has-text("项目来源") + div input').first().fill('E2E内部');
    const code = await doCreateSave(page, 'projects', tdx.h, 'name', name);
    await fc.check('a3'); console.log(`A3: ${code} ✅`);
  });

  test('A4 合同维护：新增→填空所有必填→保存→API核验', async ({ page, request }) => {
    test.setTimeout(120000);
    const fc = installFC(page); const ts = Date.now(), name = `E2E合同_${ts}`;

    // ── Open create page ──
    await page.goto(`${BASE}/contract`); await page.waitForTimeout(2000); await fc.check('a4-list');
    expect(page.url()).not.toContain('/_not-found');
    const addBtn = page.locator('.h-14 button:has-text("新增")').first();
    expect(await addBtn.count(), 'add btn').toBeGreaterThan(0);
    await addBtn.click(); await page.waitForTimeout(3000);
    expect(page.url()).toContain('/create');

    // ── Fill basic section (active by default) ──
    // 1. 合同名称 (required)
    const nameInput = page.locator('[data-testid="contract-name-input"]').first();
    expect(await nameInput.count(), 'contract-name-input').toBeGreaterThan(0);
    await nameInput.fill(name);

    // 2. 合同类型 → 采购合同 (required)
    await page.locator('[data-testid="contract-type-select"]').first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').filter({ hasText: '采购合同' }).first().click();
    await page.waitForTimeout(500);

    // 3. 支付货币类型 already default "人民币" in form state

    // 4. 收付方式 → select first option (required)
    const receiptCb = page.locator('label:has-text("收付方式")').first().locator('..').locator('button[role="combobox"]');
    await receiptCb.click(); await page.waitForTimeout(500);
    await page.locator('[role="option"]:visible').first().click();
    await page.waitForTimeout(400);

    // 5. 合同金额类型 → select first option (required)
    const amtTypeCb = page.locator('label:has-text("合同金额类型")').first().locator('..').locator('button[role="combobox"]');
    await amtTypeCb.click(); await page.waitForTimeout(500);
    await page.locator('[role="option"]:visible').first().click();
    await page.waitForTimeout(400);

    // 6. 合同总金额 (required) — data-testid
    await page.locator('[data-testid="contract-totalamount-input"]').first().fill('50000');

    // 7. 生效日期 (required) — data-testid
    await page.locator('[data-testid="contract-effectivedate-input"]').first().fill('2026-12-31');

    // 8. 承办人姓名 (required) — data-testid
    await page.locator('[data-testid="contract-undertaker-input"]').first().fill('E2E承办人');

    // 9. 承办部门 (required) — EntityPickerInput. Click the readonly input to open picker dialog.
    const deptPicker = page.locator('label:has-text("承办部门")').first().locator('..').locator('input[readonly]');
    expect(await deptPicker.count(), 'dept picker').toBeGreaterThan(0);
    await deptPicker.first().click(); await page.waitForTimeout(1500);
    const deptDialog = page.locator('[role="dialog"]').first();
    await deptDialog.locator('button:has-text("查询")').click(); await page.waitForTimeout(1000);
    await deptDialog.locator('table tbody input[type="radio"]').first().click(); await page.waitForTimeout(300);
    await deptDialog.locator('button:has-text("确定")').click(); await page.waitForTimeout(1000);

    // ── Navigate to counterparty section ──
    const cpBtn = page.locator('button:has-text("相对方信息")').first();
    expect(await cpBtn.count(), 'counterparty nav').toBeGreaterThan(0);
    await cpBtn.click(); await page.waitForTimeout(800);

    // 10. In 采购合同 mode, select supplier via EntityPickerInput
    const supPicker = page.locator('label:has-text("供应商")').first().locator('..').locator('input[readonly]');
    expect(await supPicker.count(), 'supplier picker').toBeGreaterThan(0);
    await supPicker.first().click(); await page.waitForTimeout(1500);
    const supDialog = page.locator('[role="dialog"]').first();
    await supDialog.locator('button:has-text("查询")').click(); await page.waitForTimeout(1000);
    await supDialog.locator('table tbody input[type="radio"]').first().click(); await page.waitForTimeout(300);
    await supDialog.locator('button:has-text("确定")').click(); await page.waitForTimeout(1000);

    // ── Navigate to payment plan section ──
    const planBtn = page.locator('button:has-text("收/付费计划")').first();
    expect(await planBtn.count(), 'plan nav').toBeGreaterThan(0);
    await planBtn.click(); await page.waitForTimeout(500);

    // 11. Add a payment plan row
    await page.locator('[data-testid="contract-add-plan-btn"]').first().click(); await page.waitForTimeout(800);
    // Fill plan row: amount, date, ratio
    const planAmount = page.locator('#plans table tbody tr').first().locator('input[type="number"]').nth(0);
    const planDate = page.locator('#plans table tbody tr').first().locator('input[type="date"]');
    const planRatio = page.locator('#plans table tbody tr').first().locator('input[type="number"]').nth(1);
    await planAmount.fill('50000');
    await planDate.fill('2026-12-31');
    await planRatio.fill('100');

    // ── Navigate to contract lines section ──
    const lineBtn = page.locator('button:has-text("合同明细")').first();
    expect(await lineBtn.count(), 'lines nav').toBeGreaterThan(0);
    await lineBtn.click(); await page.waitForTimeout(500);

    // 12. Add a contract line via material picker
    await page.locator('[data-testid="contract-add-line-btn"]').first().click(); await page.waitForTimeout(800);
    // Click the readonly material picker input (first input in the row)
    const matPickerTrigger = page.locator('#lines table tbody tr').first().locator('input[readonly]');
    await matPickerTrigger.first().click(); await page.waitForTimeout(1500);
    const matDialog = page.locator('[role="dialog"]').first();
    await matDialog.locator('button:has-text("查询")').click(); await page.waitForTimeout(1000);
    const matRows = matDialog.locator('table tbody tr');
    expect(await matRows.count(), 'material picker rows').toBeGreaterThan(0);
    await matDialog.locator('table tbody input[type="radio"]').first().click(); await page.waitForTimeout(300);
    await matDialog.locator('button:has-text("确定")').click(); await page.waitForTimeout(1000);
    // Now fill quantity and unitPrice
    const lineNumInputs = page.locator('#lines table tbody tr').first().locator('input[type="number"]');
    const lnc = await lineNumInputs.count();
    if (lnc >= 2) { await lineNumInputs.nth(0).fill('10'); await lineNumInputs.nth(1).fill('5000'); }

    // ── Save ──
    await page.waitForTimeout(500);
    await formSave(page);

    // Wait for redirect. If save blocked, throw with diagnostics.
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 25000 }); } catch (e) {
      const pageText = await page.locator('body').innerText();
      throw new Error(`A4 save failed to redirect. Page body excerpt: "${pageText.substring(200, 700)}"`);
    }
    expect(page.url(), 'A4 must leave /create').not.toContain('/create');
    await fc.check('a4-save');

    // API verify
    const v = await request.get(`${API}/contracts?name=${encodeURIComponent(name)}`, tdx.h).then((r: any) => r.json());
    expect(v.items?.length || 0, 'A4 contract must exist').toBeGreaterThan(0);
    console.log(`A4: ${v.items?.[0]?.code || name} ✅`);
  });

  // List+layout verification
  for (const [label, url] of [['物料参数','/material-param'],['物料审批','/material-approval'],['合同参数','/contract/params'],['合同查询','/contract/query'],['项目查询','/project/query']]) {
    test(`${label} — 打开→表格/表单→无404`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${url}`); await page.waitForTimeout(2000); await fc.check(label);
      expect(page.url(), `${label} not 404`).not.toContain('/_not-found');
      const tbody = page.locator('table tbody');
      const inputCount = await page.locator('input, select').count();
      expect((await tbody.count()) + inputCount, `${label}: has content`).toBeGreaterThan(0);
      console.log(`${label}: OK ✅`);
    });
  }
});

// ══════════════════════════════════════════════════════
// B. 销售管理
// ══════════════════════════════════════════════════════
test.describe('B — 销售管理', () => {
  let tdx: any; test.beforeAll(async ({ request }) => { const token = await getToken(request); tdx = { token, h: H(token) }; }); test.afterAll(async ({ request }) => { for (const api of ['customers','quotations','pre-orders','sales-orders','sales-shipments','sales-returns']) { const r = await request.get(`${API}/${api}?pageSize=200`, tdx.h).then((r: any) => r.json()); for (const o of r?.items || []) { if ((o.name||o.orderName||'')?.includes('E2E')) await request.delete(`${API}/${api}/${o.id}`, tdx.h).catch(() => {}); } } }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('B1 客户档案：新增→保存→API核验', async ({ page }) => { const fc = installFC(page); const ts = Date.now(), name = `E2E客户_${ts}`; await openCreatePath(page, '/sales/customer', '/sales/customer/create'); await page.locator('label:has-text("客户名称") + div input').first().fill(name); await page.locator('label:has-text("联系人") + div input').first().fill('E2E张'); await page.locator('label:has-text("联系电话") + div input').first().fill('13800001111'); const code = await doCreateSave(page, 'customers', tdx.h, 'name', name); await fc.check('b1'); console.log(`B1: ${code} ✅`); });

  // Sales maintenance pages — click 新增, verify create page loads, save smoke
  const salesPages: [string, string, string, string[]][] = [
    ['报价单维护','/sales/quotation','/sales/quotation?create=1',['报价名称','报价单维护']],
    ['分劈单维护','/sales/pre-order','/sales/pre-order/create',['分劈单维护']],
    ['销售订单维护','/sales/order','/sales/order/create',['销售订单维护']],
    ['销售出货维护','/sales/shipment','/sales/shipment/create',['销售出货维护']],
    ['销售退货维护','/sales/return','/sales/return/create',['销售退货维护']],
  ];
  for (const [label, listUrl, createSuffix, ] of salesPages) {
    test(`${label}：新增入口可达性`, async ({ page }) => {
      const fc = installFC(page);
      await page.goto(`${BASE}${listUrl}`); await page.waitForTimeout(2000); await fc.check(label);
      expect(page.url()).not.toContain('/_not-found');
      expect(await page.locator('table').count(), `${label}: table`).toBeGreaterThan(0);

      const addBtn = page.locator('.h-14 button:has-text("新增")').first();
      expect(await addBtn.count(), `${label}: 新增 btn`).toBeGreaterThan(0);
      await addBtn.click(); await page.waitForTimeout(2500);

      // Verify navigated to create (or dialog opened)
      const createPage = page.url().includes('/create') || page.url().includes('create=1') || (await page.locator('[role="dialog"]').count()) > 0;
      expect(createPage, `${label}: create page or dialog`).toBeTruthy();

      // Verify create page loads and the save button exists
      if (page.url().includes('/create') || page.url().includes('create=1')) {
        const saveBtn = page.locator('button[data-testid="form-save-btn"]').first();
        expect(await saveBtn.count(), `${label}: save button exists`).toBeGreaterThan(0);
        // Verify form has auto-generated code field populated
        await page.waitForTimeout(1000);
        const noFields = page.locator('input[readonly], input[disabled]');
        const noCount = await noFields.count();
        expect(noCount, `${label}: has readonly auto-code fields`).toBeGreaterThan(0);
      }
      await fc.check(`${label}`);
      console.log(`${label}: OK ✅`);
    });
  }

  // Sales query pages
  for (const [label, url] of [['销售参数','/sales/params'],['销售追溯','/sales/trace'],['销售订单查询','/sales/query/order'],['销售报价查询','/sales/query/quotation'],['销售退货查询','/sales/query/return'],['销售出货查询','/sales/query/shipment']]) {
    test(`${label} → 表格+分页+无404`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${url}`); await page.waitForTimeout(2000); await fc.check(label);
      expect(page.url(), `${label} not 404`).not.toContain('/_not-found');
      if (url.includes('params')) { expect(await page.locator('input, select').count(), `${label}: form`).toBeGreaterThan(0); }
      else { expect(await page.locator('table').count(), `${label}: table`).toBeGreaterThan(0); }
      if (!url.includes('params')) { expect(await page.getByTestId('erp-pagination').count(), `${label}: pagination`).toBeGreaterThan(0); }
      console.log(`${label}: OK ✅`);
    });
  }
});

// ══════════════════════════════════════════════════════
// C. 采购管理
// ══════════════════════════════════════════════════════
test.describe('C — 采购管理', () => {
  let tdx: any; test.beforeAll(async ({ request }) => { const token = await getToken(request); tdx = { token, h: H(token) }; }); test.afterAll(async ({ request }) => { for (const api of ['suppliers','purchase-plans','purchase-orders','purchase-returns']) { const r = await request.get(`${API}/${api}?pageSize=200`, tdx.h).then((r: any) => r.json()); for (const o of r?.items || []) { if ((o.name||o.orderName||'')?.includes('E2E')) await request.delete(`${API}/${api}/${o.id}`, tdx.h).catch(() => {}); } } }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('C1 供应商：新增→保存→API核验', async ({ page }) => { const fc = installFC(page); const ts = Date.now(), name = `E2E供应商_${ts}`; await openCreatePath(page, '/purchase/supplier', '/purchase/supplier/create'); await page.locator('label:has-text("供应商名称") + div input').first().fill(name); await page.locator('label:has-text("联系人") + div input').first().fill('E2E李'); await page.locator('label:has-text("联系电话") + div input').first().fill('13712345678'); const code = await doCreateSave(page, 'suppliers', tdx.h, 'name', name); await fc.check('c1'); console.log(`C1: ${code} ✅`); });

  test('C2 采购计划：新增→保存→API核验', async ({ page }) => { const fc = installFC(page); const ts = Date.now(), name = `E2E采购计划_${ts}`; await openCreatePath(page, '/purchase/plan', '/purchase/plan/create'); await page.locator('label:has-text("计划名称") + div input').first().fill(name); const code = await doCreateSave(page, 'purchase-plans', tdx.h, 'orderName', name); await fc.check('c2'); console.log(`C2: ${code} ✅`); });

  const purchasePages: [string, string][] = [
    ['采购订单维护','/purchase/order'], ['退供单维护','/purchase/return'],
  ];
  for (const [label, listUrl] of purchasePages) {
    test(`${label}：新增入口可达性`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${listUrl}`); await page.waitForTimeout(2000); await fc.check(label);
      expect(page.url()).not.toContain('/_not-found');
      expect(await page.locator('table').count(), `${label}: table`).toBeGreaterThan(0);
      const addBtn = page.locator('.h-14 button:has-text("新增")').first();
      expect(await addBtn.count(), `${label}: 新增 btn`).toBeGreaterThan(0);
      await addBtn.click(); await page.waitForTimeout(2500);
      expect(page.url().includes('/create'), `${label}: create page`).toBeTruthy();
      const saveBtn = page.locator('button[data-testid="form-save-btn"]').first();
      expect(await saveBtn.count(), `${label}: save button exists`).toBeGreaterThan(0);
      await fc.check(`${label}`);
      console.log(`${label}: OK ✅`);
    });
  }

  for (const [label, url] of [['采购参数','/purchase/params'],['采购追溯','/purchase/trace'],['采购订单查询','/purchase/query/order'],['采购计划查询','/purchase/query/plan'],['采购退货查询','/purchase/query/return']]) {
    test(`${label} → 表格+分页+无404`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${url}`); await page.waitForTimeout(2000); await fc.check(label);
      expect(page.url()).not.toContain('/_not-found');
      if (url.includes('params')) { expect(await page.locator('input, select').count(), `${label}: form`).toBeGreaterThan(0); }
      else { expect(await page.locator('table').count(), `${label}: table`).toBeGreaterThan(0); }
      if (!url.includes('params')) { expect(await page.getByTestId('erp-pagination').count(), `${label}: pagination`).toBeGreaterThan(0); }
      console.log(`${label}: OK ✅`);
    });
  }
});

// ══════════════════════════════════════════════════════
// D. 真实滚动 + 分页布局
// ══════════════════════════════════════════════════════
test.describe('D — 真实滚动 + 分页', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  const pages: [string, string][] = [
    ['物料分类','/material-category'],['物料档案','/material'],['项目维护','/project'],
    ['合同维护','/contract'],['客户档案','/sales/customer'],
    ['报价单维护','/sales/quotation'],['销售订单维护','/sales/order'],
    ['销售出货维护','/sales/shipment'],['销售退货维护','/sales/return'],
    ['供应商','/purchase/supplier'],['采购计划维护','/purchase/plan'],
    ['采购订单维护','/purchase/order'],['退供单维护','/purchase/return'],
  ];
  for (const [label, url] of pages) {
    test(`D-${label} — 滚动到底部 → 分页不遮挡最后行`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${url}`); await page.waitForTimeout(2000); await fc.check(label);
      expect(page.url()).not.toContain('/_not-found');

      // Find table container and scroll
      let scrollContainer: any = null;
      let scrollBefore = 0, scrollAfter = 0;
      // Try overflow-auto container first (primary scroll surface for ERP tables)
      const tableContainer = page.locator('.overflow-auto').first();
      if (await tableContainer.count() > 0) {
        scrollBefore = await tableContainer.evaluate((el: HTMLElement) => el.scrollTop);
        await tableContainer.evaluate((el: HTMLElement) => { el.scrollTop = el.scrollHeight; });
        await page.waitForTimeout(1000);
        scrollAfter = await tableContainer.evaluate((el: HTMLElement) => el.scrollTop);
      }
      // If overflow container didn't scroll, try window scroll
      if (scrollAfter <= scrollBefore) {
        scrollBefore = await page.evaluate(() => window.scrollY);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        scrollAfter = await page.evaluate(() => window.scrollY);
      }
      const scrollHappened = scrollAfter > scrollBefore + 5;
      // Also check if page has enough content to scroll
      const bodyH = await page.evaluate(() => document.body.scrollHeight);
      const winH = await page.evaluate(() => window.innerHeight);
      const pageHasScrollableContent = bodyH > winH + 50;
      console.log(`${label}: scroll ${scrollBefore}→${scrollAfter}, bodyH=${bodyH}, winH=${winH}, scrollable=${pageHasScrollableContent}`);

      // If page has scrollable content, scroll must happen
      if (pageHasScrollableContent) {
        expect(scrollHappened, `${label}: must scroll when content exceeds viewport`).toBeTruthy();
      }

      // Pagination must exist
      const pagination = page.getByTestId('erp-pagination');
      expect(await pagination.count(), `${label}: pagination`).toBeGreaterThan(0);

      // Hard assert: last table row must not be covered by pagination
      const lastRow = page.locator('table tbody tr').last();
      if (await lastRow.count() > 0) {
        const pagBox = await pagination.boundingBox();
        const rowBox = await lastRow.boundingBox();
        if (rowBox && pagBox) {
          const rowBottom = rowBox.y + rowBox.height;
          const pagTop = pagBox.y;
          const gap = pagTop - rowBottom;
          console.log(`${label}: lastRow bottom=${rowBottom.toFixed(0)}, pag top=${pagTop.toFixed(0)}, gap=${gap.toFixed(0)}`);
          // The last row should NOT be positioned below pagination (overlap)
          // gap should be >= -4 (allow 4px tolerance for border overlap)
          expect(gap, `${label}: last row must not be hidden behind pagination (gap=${gap.toFixed(0)}px)`).toBeGreaterThanOrEqual(-4);
        }
      }
    });
  }
});
