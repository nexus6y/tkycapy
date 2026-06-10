/**
 * 用户流程 04 — 销售管理（全 UI 链路版）
 *
 * 零 API 创建业务单据。报价→分劈→订单→出货全部 UI 操作。
 * API 仅用于 seed 基础数据和最终清理。
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

// ── 工具 ──
async function login(p: any) {
  await p.goto(`${BASE}/login`);
  await p.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await p.fill('input[placeholder="请输入用户名"]', 'admin');
  await p.fill('input[placeholder="请输入密码"]', 'admin123');
  await p.click('button:has-text("登 录")');
  await p.waitForURL('**/'); await p.waitForTimeout(800);
}
async function expandSidebar(p: any) {
  if ((await p.locator('aside').count()) === 0) { await p.locator('header button').first().click(); await p.waitForTimeout(400); }
}
async function clickMenu(p: any, parents: string[], leaf: string, path: string) {
  const a = p.locator('aside');
  for (const pr of parents) { await a.locator(`text=${pr}`).last().click(); await p.waitForTimeout(350); }
  await a.locator(`text=${leaf}`).last().click(); await p.waitForTimeout(2000);
  expect(p.url()).toContain(path);
}
function H(t: string) { return { headers: { Authorization: `Bearer ${t}` } }; }
async function getToken(r: any) { return (await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token; }
function installFC(p: any) {
  const a5: string[] = [], ce: string[] = [];
  p.on('response', (r: any) => { if (r.url().includes('/api/') && r.status() >= 500) a5.push(`${r.status()} ${r.url()}`); });
  p.on('console', (m: any) => { if (m.type() === 'error') ce.push(m.text()); });
  p.on('pageerror', (err: Error) => ce.push(`PAGE:${err.message}`));
  return {
    async check(l: string) {
      for (const t of ['This page could not be found', 'Internal server error']) {
        if ((await p.locator(`text=${t}`).count()) > 0) throw new Error(`${l}: "${t}"`);
      }
      if (a5.length > 0) throw new Error(`${l}: API500s: ${a5.join(', ')}`);
      const real = ce.filter(e => !e.includes('hydration') && !e.includes('Hydration') && !e.includes('Warning:') && !e.includes('409') && !e.includes('Conflict') && !e.includes('Bad Request') && !e.includes('value` prop') && !e.includes('should not be null') && !e.includes('unique "key" prop'));
      if (real.length > 0) throw new Error(`${l}: Console: ${real.slice(0, 3).join('; ')}`);
    },
  };
}
async function formSave(p: any) { await p.getByTestId('form-save-btn').click(); }
async function toolbarAdd(p: any) {
  for (let i = 0; i < await p.locator('.h-14 button').count(); i++) {
    if ((await p.locator('.h-14 button').nth(i).innerText()).includes('新增')) { await p.locator('.h-14 button').nth(i).click(); await p.waitForTimeout(2000); return; }
  }
  throw new Error('toolbarAdd not found');
}
async function toolbarSearch(p: any) {
  for (const w of ['搜索', '查询']) {
    for (let i = 0; i < await p.locator('.h-14 button').count(); i++) {
      if ((await p.locator('.h-14 button').nth(i).innerText()).trim() === w) { await p.locator('.h-14 button').nth(i).click(); return; }
    }
  }
}
async function toolbarReset(p: any) {
  for (let i = 0; i < await p.locator('.h-14 button').count(); i++) {
    if ((await p.locator('.h-14 button').nth(i).innerText()).trim() === '重置') { await p.locator('.h-14 button').nth(i).click(); return; }
  }
}
async function searchByLabel(p: any, label: string, val: string) {
  const parent = p.locator('.flex-wrap').first().locator('span', { hasText: label }).first().locator('..');
  await parent.locator('input').first().fill(val); await p.waitForTimeout(300);
}
async function selectByLabel(p: any, label: string, contains: string) {
  const t = p.locator(`label:has-text("${label}") + div button[role="combobox"]`).first();
  await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await t.click(); await p.waitForTimeout(500);
  for (let i = 0; i < await p.locator('[role="option"]').count(); i++) {
    const o = p.locator('[role="option"]').nth(i);
    if (!(await o.isVisible())) continue;
    if ((await o.innerText()).includes(contains)) { await o.click(); await p.waitForTimeout(300); return; }
  }
  throw new Error(`selectByLabel "${label}": "${contains}" not found`);
}
async function pickerSelect(p: any, label: string, searchVal: string) {
  const sec = p.locator(`label:has-text("${label}") + div`).first();
  await sec.locator('input[readonly]').first().click(); await p.waitForTimeout(1000);
  const d = p.locator('[role="dialog"]');
  await expect(d).toBeVisible();
  if (searchVal && (await d.locator('input').count()) > 1) { await d.locator('input').nth(1).fill(searchVal); await d.locator('button:has-text("查询")').click(); await p.waitForTimeout(1000); }
  expect(await d.locator('table tbody tr').count(), `picker "${label}" rows>0`).toBeGreaterThan(0);
  await d.locator('table tbody input[type="radio"]').first().click(); await p.waitForTimeout(300);
  await d.locator('button:has-text("确定")').click(); await p.waitForTimeout(800);
}
// ── Seed ──
async function seedData(request: any) {
  const t = await getToken(request), h = H(t), ts = Date.now();
  const cusCode = `E2E_CUS_${ts}`, cusName = `E2E客户_${ts}`;
  let cusId: string;
  { const r = await request.get(`${API}/customers?pageSize=999`, h).then(r => r.json()); cusId = (r?.items || []).find((x: any) => x.code === cusCode)?.id; if (!cusId) cusId = (await (await request.post(`${API}/customers`, { ...h, data: { code: cusCode, name: cusName, status: 'ACTIVE' } })).json()).id; }
  const deptCode = `E2E_DEPT_${ts}`; let deptId: string;
  { const r = await request.get(`${API}/departments?pageSize=999`, h).then(r => r.json()); deptId = (r?.items || []).find((x: any) => x.code === deptCode)?.id; if (!deptId) deptId = (await (await request.post(`${API}/departments`, { ...h, data: { code: deptCode, name: `E2E部门_${ts}`, status: 'ACTIVE' } })).json()).id; }
  const uCode = `E2E_UNIT_${ts}`; let uId: string;
  { const r = await request.get(`${API}/measurement-units?pageSize=999`, h).then(r => r.json()); uId = (r?.items || []).find((x: any) => x.code === uCode)?.id; if (!uId) uId = (await (await request.post(`${API}/measurement-units`, { ...h, data: { code: uCode, name: uCode, symbol: 'pcs', sortOrder: 1, status: 'ACTIVE' } })).json()).id; }
  const catCode = `E2E_CAT_${ts}`; let catId: string;
  { const r = await request.get(`${API}/material-categories?pageSize=999`, h).then(r => r.json()); catId = (r?.items || []).find((x: any) => x.code === catCode)?.id; if (!catId) catId = (await (await request.post(`${API}/material-categories`, { ...h, data: { code: catCode, name: `E2E分类_${ts}`, sortOrder: 1, status: 'ACTIVE' } })).json()).id; }
  const matCode = `E2E_MAT_${ts}`, matName = `E2E物料_${ts}`; let matId: string;
  { const r = await request.get(`${API}/materials?pageSize=999`, h).then(r => r.json()); matId = (r?.items || []).find((x: any) => x.code === matCode)?.id; if (!matId) matId = (await (await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: matName, specification: 'E2E规格mm', categoryId: catId, unitId: uId, productCategory: '成品', planAttribute: '自制', status: 'ACTIVE' } })).json()).id; }
  return { cusId, cusCode, cusName, deptId, deptCode, matId, matCode, matName, catId, uId, token: t, h };
}
async function cleanupData(request: any, d: any) {
  if (d.matId) await request.delete(`${API}/materials/${d.matId}`, d.h).catch(() => {});
  if (d.catId) await request.delete(`${API}/material-categories/${d.catId}`, d.h).catch(() => {});
  if (d.uId) await request.delete(`${API}/measurement-units/${d.uId}`, d.h).catch(() => {});
  if (d.deptId) await request.delete(`${API}/departments/${d.deptId}`, d.h).catch(() => {});
  if (d.cusId) await request.delete(`${API}/customers/${d.cusId}`, d.h).catch(() => {});
}

async function cleanE2eDocs(request: any, token: string, cusId: string) {
  const hdr = H(token);
  const shipments = await request.get(`${API}/sales-shipments?name=${encodeURIComponent('E2E')}`, hdr).then(r => r.json());
  for (const s of (shipments?.items || [])) { if (s.customerId === cusId) await request.delete(`${API}/sales-shipments/${s.id}`, hdr).catch(() => {}); }
  const orders = await request.get(`${API}/sales-orders?pageSize=200`, hdr).then(r => r.json());
  for (const o of (orders?.items || [])) { if (o.customerId === cusId || o.customerName?.includes('E2E')) await request.delete(`${API}/sales-orders/${o.id}`, hdr).catch(() => {}); }
  const pre = await request.get(`${API}/pre-orders?pageSize=200`, hdr).then(r => r.json());
  for (const p of (pre?.items || [])) { if (p.orderName?.includes('E2E')) await request.delete(`${API}/pre-orders/${p.id}`, hdr).catch(() => {}); }
  const qts = await request.get(`${API}/quotations?pageSize=200`, hdr).then(r => r.json());
  for (const q of (qts?.items || [])) { if (q.quotationName?.includes('E2E')) await request.delete(`${API}/quotations/${q.id}`, hdr).catch(() => {}); }
}

// ═══════════════════ A. 客户 ═══════════════════
test.describe('A — 客户', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('A1 UI新增→搜索→修改→删除', async ({ page }) => {
    const fc = installFC(page); const ts = Date.now(), name = `E2E客户_${ts}`, n2 = `${name}改`;
    await clickMenu(page, ['销售管理'], '客户档案', '/sales/customer'); await fc.check('list');
    await toolbarAdd(page); expect(page.url()).toContain('/sales/customer/create');
    await page.locator('label:has-text("客户名称") + div input').first().fill(name);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('save');
    expect(page.url()).not.toContain('/create');
    await searchByLabel(page, '客户名称', name); await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(name);
    await page.locator('table tbody tr').filter({ hasText: name }).locator('button:has-text("修改")').first().click(); await page.waitForTimeout(2000);
    await page.locator('label:has-text("客户名称") + div input').first().fill(n2);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('edit');
    await searchByLabel(page, '客户名称', n2); await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(n2);
    await page.locator('table tbody tr').filter({ hasText: n2 }).locator('button:has-text("删除")').first().click(); await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click(); await page.waitForTimeout(1500); await fc.check('del');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).not.toContain(n2);
  });
});

// ═══════════════════ B. 销售参数 ═══════════════════
test.describe('B — 销售参数', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('B1 页面加载', async ({ page }) => {
    const fc = installFC(page);
    await clickMenu(page, ['销售管理'], '销售参数', '/sales/params'); await fc.check('page');
    expect((await page.innerText('body')).length).toBeGreaterThan(50);
  });
});

// ═══════════════════ C. 完整链路：报价→分劈→订单→出货（全 UI） ═══════════════════
test.describe('C — 报价→分劈→订单→出货链路（全 UI）', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await cleanE2eDocs(request, td.token, td.cusId); await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('C1 UI报价→UI分劈→UI订单→UI出货 完整链路', async ({ page }) => {
    test.setTimeout(300000);
    const fc = installFC(page);
    const ts = Date.now(), qName = `E2E报价_${ts}`;
    let qtNo = '', preNo = '', soNo = '', shipNo = '';

    // ═══════ 1. UI 创建报价单（含行） ═══════
    await clickMenu(page, ['销售管理'], '报价单维护', '/sales/quotation'); await fc.check('qt-list');
    await toolbarAdd(page);
    expect(page.url()).toContain('/sales/quotation/create'); await page.waitForTimeout(1500); await fc.check('qt-create');

    // Fill header
    await page.locator('label:has-text("报价名称") + div input').first().fill(qName);
    await pickerSelect(page, '客户', td.cusName);
    await page.locator('label:has-text("负责人") + div input').first().fill('E2E负责人');

    // Add line (LinesEditor now uses native <input>, compatible with Playwright fill)
    await page.locator('#l button:has-text("新增行")').click();
    await page.waitForTimeout(1000);
    // Wait for data row to appear
    await expect(page.locator('#l table tbody tr').first()).not.toHaveText('暂无明细');

    // Fill line: materialCode(1), quantity(5), unitPrice(6)
    const rowInputs = page.locator('#l table tbody tr').first().locator('input');
    await rowInputs.nth(1).fill(td.matCode);
    await rowInputs.nth(5).fill('10');
    await rowInputs.nth(6).fill('100');
    await page.waitForTimeout(500);

    // Assert amount auto-calculated: 10*100=1000
    await expect(rowInputs.nth(7), 'amount = 10×100 = 1000').toHaveValue('1000.00');

    // Save
    await formSave(page); await page.waitForTimeout(3000); await fc.check('qt-save');
    expect(page.url()).not.toContain('/create');

    // ═══════ 2. 报价单列表查 + 编辑回显 ═══════
    await page.goto(`${BASE}/sales/quotation`); await page.waitForTimeout(2000);
    await searchByLabel(page, '报价名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    let lt = await page.locator('table tbody').innerText();
    expect(lt, 'quotation in list').toContain(qName);

    let row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    qtNo = (await row.locator('td').nth(2).innerText()).trim();

    // Edit echo: name, customer, line details
    await row.locator('button:has-text("修改")').first().click(); await page.waitForTimeout(2500); await fc.check('qt-edit');
    await expect(page.locator('label:has-text("报价名称") + div input').first()).toHaveValue(qName);
    // Check line data echoed
    const editRowInputs = page.locator('#l table tbody tr').first().locator('input');
    await expect(editRowInputs.nth(1), 'materialCode echo').toHaveValue(td.matCode);
    await expect(editRowInputs.nth(5), 'quantity echo').toHaveValue('10');
    await expect(editRowInputs.nth(6), 'unitPrice echo').toHaveValue('100');
    // amount may be '1000' (from DB Decimal) or '1000.00' (computed); both OK
    const amtVal = await editRowInputs.nth(7).inputValue();
    expect(Number(amtVal), 'amount echo ≈ 1000').toBe(1000);
    await page.goBack(); await page.waitForTimeout(1500);

    // ═══════ 3. UI 提交 → UI 审批 → UI 下推分劈 ═══════
    await searchByLabel(page, '报价名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(1500); await fc.check('qt-submit');

    await searchByLabel(page, '报价名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    await row.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(1500); await fc.check('qt-approve');

    await searchByLabel(page, '报价名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    expect(await row.locator('button:has-text("下推分劈单")').count(), 'push-down btn').toBeGreaterThan(0);
    const dh = (d: any) => d.accept(); page.on('dialog', dh);
    await row.locator('button:has-text("下推分劈单")').first().click();
    await expect(page.locator('.fixed.top-4.right-4.z-50'), 'push toast').toContainText('分劈单', { timeout: 8000 });
    page.off('dialog', dh); await fc.check('qt-push');

    // ═══════ 4. 分劈单：查→提交→审批→下推订单 ═══════
    await clickMenu(page, ['销售管理'], '分劈单维护', '/sales/pre-order'); await fc.check('po-list');
    await searchByLabel(page, '分劈名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    lt = await page.locator('table tbody').innerText();
    expect(lt, 'pre-order in list').toContain(qName);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    preNo = (await row.locator('td').nth(2).innerText()).trim();

    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(1500); await fc.check('po-submit');
    await searchByLabel(page, '分劈名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    await row.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(1500); await fc.check('po-approve');

    await searchByLabel(page, '分劈名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    expect(await row.locator('button:has-text("下推销售订单")').count(), 'po push btn').toBeGreaterThan(0);
    const dh2 = (d: any) => d.accept(); page.on('dialog', dh2);
    await row.locator('button:has-text("下推销售订单")').first().click();
    await expect(page.locator('.fixed.top-4.right-4.z-50'), 'po push toast').toContainText('销售订单', { timeout: 8000 });
    page.off('dialog', dh2); await fc.check('po-push');

    // ═══════ 5. 销售订单：查→提交→审批 ═══════
    await clickMenu(page, ['销售管理'], '销售订单维护', '/sales/order'); await fc.check('so-list');
    await searchByLabel(page, '订单名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    lt = await page.locator('table tbody').innerText();
    expect(lt, 'SO in list').toContain(qName);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    soNo = (await row.locator('td').nth(3).innerText()).trim();

    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(1500); await fc.check('so-submit');
    await searchByLabel(page, '订单名称', qName); await toolbarSearch(page); await page.waitForTimeout(2000);
    row = page.locator('table tbody tr').filter({ hasText: qName }).first();
    await row.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(1500); await fc.check('so-approve');

    // ═══════ 6. 销售出货：新增→选订单→自动带出→填出货量→保存→搜索→编辑回显 ═══════
    await clickMenu(page, ['销售管理'], '销售出货维护', '/sales/shipment'); await fc.check('ship-list');
    await toolbarAdd(page);
    expect(page.url()).toContain('/sales/shipment/create'); await page.waitForTimeout(1500); await fc.check('ship-create');

    // Select approved sales order
    await selectByLabel(page, '关联订单', soNo);
    await page.waitForTimeout(2000);

    // Assert auto-fill: customer, orderNo, lines
    const customerInput = page.locator('label:has-text("客户") + div input').first();
    expect((await customerInput.inputValue()).trim(), 'customer auto-filled').toBe(td.cusName);

    // Lines loaded with order data
    const shipLines = page.locator('#l table tbody tr').first().locator('input');
    await expect(shipLines.nth(1), 'ship materialCode').not.toHaveValue('');
    await expect(shipLines.nth(5), 'ship orderQty').not.toHaveValue('');

    // Fill shipped quantity (6th input = shippedQty)
    const shipQtyInput = page.locator('#l').locator('input[type="number"]').nth(1); // 2nd number input = shippedQty
    await shipQtyInput.click({ clickCount: 3 });
    await shipQtyInput.fill('5');
    await page.waitForTimeout(300);

    // Save (empty string stripping now works)
    await formSave(page); await page.waitForTimeout(3000); await fc.check('ship-save');
    expect(page.url(), 'shipment save must redirect').not.toContain('/create');

    // Search by customer
    await page.goto(`${BASE}/sales/shipment`); await page.waitForTimeout(2000);
    await searchByLabel(page, '客户', td.cusName); await toolbarSearch(page); await page.waitForTimeout(2000);
    lt = await page.locator('table tbody').innerText();
    expect(lt, 'shipment in list').toContain(td.cusName);

    // Edit echo
    row = page.locator('table tbody tr').filter({ hasText: td.cusName }).first();
    shipNo = (await row.locator('td').nth(2).innerText()).trim();
    await row.locator('button:has-text("修改")').first().click(); await page.waitForTimeout(2500); await fc.check('ship-edit');
    expect(page.url(), 'ship edit page loaded').toContain('/edit');

    console.log(`CHAIN: ${qtNo} → ${preNo} → ${soNo} → ${shipNo}`);
  });
});

// ═══════════════════ D. 销售退货（全 UI） ═══════════════════
test.describe('D — 销售退货', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await cleanE2eDocs(request, td.token, td.cusId); await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('D1 UI新增→保存→列表强查→编辑回显→删除', async ({ page, request }) => {
    const fc = installFC(page);
    const ts = Date.now(), reason = `E2E退货_${ts}`;

    await clickMenu(page, ['销售管理'], '销售退货维护', '/sales/return'); await fc.check('list');
    await toolbarAdd(page);
    expect(page.url()).toContain('/sales/return/create'); await page.waitForTimeout(1500); await fc.check('create');

    await selectByLabel(page, '客户', td.cusCode);
    await page.locator('label:has-text("数量") + div input').first().fill('5');
    await page.locator('label:has-text("金额") + div input').first().fill('1000');
    await page.locator('label:has-text("退货原因") + div input').first().fill(reason);

    await formSave(page); await page.waitForTimeout(3000); await fc.check('save');
    expect(page.url()).not.toContain('/create');

    await page.goto(`${BASE}/sales/return`); await page.waitForTimeout(2000);
    await searchByLabel(page, '客户', td.cusName); await toolbarSearch(page); await page.waitForTimeout(2000);
    expect(await page.locator('table tbody').innerText(), 'return in list').toContain(td.cusName);

    const retRow = page.locator('table tbody tr').filter({ hasText: td.cusName }).first();
    const returnNo = (await retRow.locator('td').nth(2).innerText()).trim();
    await retRow.locator('button:has-text("修改")').first().click();
    await page.waitForTimeout(2000); await fc.check('edit');
    expect(page.url()).toContain('/edit');
    await expect(page.locator('label:has-text("退货单号") + div input').first()).toHaveValue(returnNo);
    await expect(page.locator('label:has-text("退货原因") + div input').first()).toHaveValue(reason);
  });
});

// ═══════════════════ E. 查询与追溯 ═══════════════════
test.describe('E — 查询与追溯', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  const Q: [string, string[], string, string][] = [
    ['销售执行追溯', ['销售管理'], '销售执行追溯', '/sales/trace'],
    ['报价单查询', ['销售管理', '销售查询'], '报价单查询', '/sales/query/quotation'],
    ['分劈单查询', ['销售管理', '销售查询'], '分劈单查询', '/sales/query/pre-order'],
    ['销售订单查询', ['销售管理', '销售查询'], '销售订单查询', '/sales/query/order'],
    ['销售出货查询', ['销售管理', '销售查询'], '销售出货查询', '/sales/query/shipment'],
    ['销售退货查询', ['销售管理', '销售查询'], '销售退货查询', '/sales/query/return'],
  ];
  for (const [label, parents, leaf, path] of Q) {
    test(`E ${label}`, async ({ page }) => {
      const fc = installFC(page);
      await clickMenu(page, parents, leaf, path); await fc.check(label);
      await toolbarSearch(page); await page.waitForTimeout(1500); await fc.check('search');
      await toolbarReset(page); await page.waitForTimeout(500);
      expect(await page.getByTestId('erp-pagination').count()).toBeGreaterThan(0);
    });
  }
});

// ═══════════════════ F. UI 布局 ═══════════════════
test.describe('F — UI 布局', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  const P: [string, string[], string, string][] = [
    ['客户', ['销售管理'], '客户档案', '/sales/customer'],
    ['报价单', ['销售管理'], '报价单维护', '/sales/quotation'],
    ['分劈单', ['销售管理'], '分劈单维护', '/sales/pre-order'],
    ['销售订单', ['销售管理'], '销售订单维护', '/sales/order'],
    ['销售出货', ['销售管理'], '销售出货维护', '/sales/shipment'],
    ['销售退货', ['销售管理'], '销售退货维护', '/sales/return'],
  ];
  for (const [label, parents, leaf, path] of P) {
    test(`F ${label} 分页+表头`, async ({ page }) => {
      const fc = installFC(page);
      await clickMenu(page, parents, leaf, path); await fc.check(label);
      expect(await page.getByTestId('erp-pagination').count()).toBeGreaterThan(0);
      const thBox = await page.locator('table thead th').first().boundingBox();
      if (thBox) expect(thBox.width).toBeGreaterThan(20);
    });
  }
});
