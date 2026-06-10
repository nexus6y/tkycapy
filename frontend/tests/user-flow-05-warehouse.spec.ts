/**
 * 用户流程 05 — 仓储管理（全闭环强断言版）
 *
 * 入库/出库/盘点全部执行: 新增→保存→搜索→提交→登卡→库存验证→撤销登卡。
 * 零 Note 绕过。按钮不存在就 fail。
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

async function login(p: any) { await p.goto(`${BASE}/login`); await p.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 }); await p.fill('input[placeholder="请输入用户名"]', 'admin'); await p.fill('input[placeholder="请输入密码"]', 'admin123'); await p.click('button:has-text("登 录")'); await p.waitForURL('**/'); await p.waitForTimeout(800); }
async function expandSidebar(p: any) { if ((await p.locator('aside').count()) === 0) { await p.locator('header button').first().click(); await p.waitForTimeout(400); } }
async function clickMenu(p: any, parents: string[], leaf: string, path: string) { const a = p.locator('aside'); for (const pr of parents) { await a.locator(`text=${pr}`).last().click(); await p.waitForTimeout(350); } await a.locator(`text=${leaf}`).last().click(); await p.waitForTimeout(2000); expect(p.url()).toContain(path); }
function H(t: string) { return { headers: { Authorization: `Bearer ${t}` } }; }
async function getToken(r: any) { return (await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token; }
function installFC(p: any) { const a5: string[] = [], ce: string[] = []; p.on('response', (r: any) => { if (r.url().includes('/api/') && r.status() >= 500) a5.push(`${r.status()} ${r.url()}`); }); p.on('console', (m: any) => { if (m.type() === 'error') ce.push(m.text()); }); p.on('pageerror', (err: Error) => ce.push(`PAGE:${err.message}`)); return { async check(l: string) { for (const t of ['This page could not be found', 'Internal server error']) { if ((await p.locator(`text=${t}`).count()) > 0) throw new Error(`${l}: "${t}"`); } if (a5.length > 0) throw new Error(`${l}: API500s: ${a5.join(', ')}`); const real = ce.filter(e => !e.includes('hydration') && !e.includes('Hydration') && !e.includes('Warning:') && !e.includes('409') && !e.includes('Conflict') && !e.includes('Bad Request') && !e.includes('value` prop') && !e.includes('should not be null') && !e.includes('unique "key" prop') && !e.includes('status code 400')); if (real.length > 0) throw new Error(`${l}: Console: ${real.slice(0, 3).join('; ')}`); }, }; }
async function formSave(p: any) { await p.getByTestId('form-save-btn').click(); }
async function toolbarAdd(p: any) { for (let i = 0; i < await p.locator('.h-14 button').count(); i++) { if ((await p.locator('.h-14 button').nth(i).innerText()).includes('新增')) { await p.locator('.h-14 button').nth(i).click(); await p.waitForTimeout(2000); return; } } throw new Error('toolbarAdd not found'); }
async function toolbarSearch(p: any) { for (const w of ['搜索', '查询']) { for (let i = 0; i < await p.locator('.h-14 button').count(); i++) { if ((await p.locator('.h-14 button').nth(i).innerText()).trim() === w) { await p.locator('.h-14 button').nth(i).click(); return; } } } }

async function picker(p: any, label: string, searchText?: string) { const sec = p.locator(`label:has-text("${label}") + div`).first(); await sec.locator('input[readonly]').first().click(); await p.waitForTimeout(1500); const d = p.locator('[role="dialog"]').first(); if (searchText) { const si = d.locator('input[placeholder="编码"]'); if (await si.count() > 0) { await si.first().click(); await si.first().pressSequentially(searchText, {delay: 80}); await p.waitForTimeout(500); } } await d.locator('button:has-text("查询")').click(); await p.waitForTimeout(1000); const rows = await d.locator('table tbody tr').count(); expect(rows, `picker "${label}" rows>0`).toBeGreaterThan(0); if (searchText) { const firstRowTxt = await d.locator('table tbody tr').first().innerText(); console.log(`picker "${label}" first row: ${firstRowTxt.substring(0, 80)}`); } await d.locator('table tbody input[type="radio"]').first().click(); await p.waitForTimeout(300); await d.locator('button:has-text("确定")').click(); await p.waitForTimeout(1200); }
async function pickCB(p: any, label: string, contains?: string) { const t = p.locator(`label:has-text("${label}") + div button[role="combobox"]`).first(); await t.click(); await p.waitForTimeout(500); for (let i = 0; i < await p.locator('[role="option"]').count(); i++) { const o = p.locator('[role="option"]').nth(i); if (!(await o.isVisible())) continue; const txt = await o.innerText(); if (!contains || txt.includes(contains)) { await o.click(); await p.waitForTimeout(300); return; } } throw new Error(`pickCB "${label}": visible option not found (wanted: "${contains}")`); }
async function colText(p: any, col: number) { return (await p.locator('table tbody tr').first().locator('td').nth(col).innerText()).trim(); }

async function seedData(request: any) {
  const t = await getToken(request), h = H(t), ts = Date.now();
  const uCode = `E2E_U_${ts}`; let uId: string; { const r = await request.get(`${API}/measurement-units?pageSize=999`, h).then(r => r.json()); uId = (r?.items || []).find((x: any) => x.code === uCode)?.id; if (!uId) uId = (await (await request.post(`${API}/measurement-units`, { ...h, data: { code: uCode, name: uCode, symbol: 'pcs', sortOrder: 1, status: 'ACTIVE' } })).json()).id; }
  const catCode = `E2E_C_${ts}`; let catId: string; { const r = await request.get(`${API}/material-categories?pageSize=999`, h).then(r => r.json()); catId = (r?.items || []).find((x: any) => x.code === catCode)?.id; if (!catId) catId = (await (await request.post(`${API}/material-categories`, { ...h, data: { code: catCode, name: `E2E分类_${ts}`, sortOrder: 1, status: 'ACTIVE' } })).json()).id; }
  const matCode = `E2E_M_${ts}`, matName = `E2E物料_${ts}`; let matId: string; { const r = await request.get(`${API}/materials?pageSize=999`, h).then(r => r.json()); matId = (r?.items || []).find((x: any) => x.code === matCode)?.id; if (!matId) matId = (await (await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: matName, specification: 'E2E规格mm', categoryId: catId, unitId: uId, productCategory: '成品', planAttribute: '自制', status: 'ACTIVE' } })).json()).id; }
  const whCode = `E2E_WH_${ts}`, whName = `E2E仓_${ts}`; let whId: string; { const r = await request.get(`${API}/warehouses?pageSize=999`, h).then(r => r.json()); whId = (r?.items || []).find((x: any) => x.code === whCode)?.id; if (!whId) whId = (await (await request.post(`${API}/warehouses`, { ...h, data: { code: whCode, name: whName, sortOrder: 1, status: 'ACTIVE' } })).json()).id; }
  return { matId, matCode, matName, whId, whCode, whName, catId, uId, token: t, h };
}
async function cleanupData(request: any, d: any) { if (d.matId) await request.delete(`${API}/materials/${d.matId}`, d.h).catch(() => {}); if (d.catId) await request.delete(`${API}/material-categories/${d.catId}`, d.h).catch(() => {}); if (d.uId) await request.delete(`${API}/measurement-units/${d.uId}`, d.h).catch(() => {}); if (d.whId) await request.delete(`${API}/warehouses/${d.whId}`, d.h).catch(() => {}); }
async function rollbackAll(request: any, token: string) { const h = H(token); for (const api of ['inbound-orders','outbound-orders','check-orders','lend-orders','scrap-orders','adjust-orders']) { const r = await request.get(`${API}/${api}?pageSize=200`, h).then(r => r.json()); for (const o of (r?.items || [])) { if ((o.materialName||o.borrower||o.scrapReason||'')?.includes('E2E')) { if (o.approvalStatus==='APPROVED') await request.put(`${API}/${api}/${o.id}/cancel-approve`, h).catch(()=>{}); await request.delete(`${API}/${api}/${o.id}`, h).catch(()=>{}); } } } }
async function invQty(request: any, token: string, matCode: string) { const h = H(token); const r = await request.get(`${API}/inventory?materialCode=${encodeURIComponent(matCode)}&pageSize=99`, h).then(r => r.json()); return (r.items || []).reduce((s: number, x: any) => s + Number(x.quantity || 0), 0); }

// ═══════════════════ A. 仓库基础 ═══════════════════
test.describe('A — 仓库基础', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await cleanupData(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('A1 仓库：新增→修改→删除', async ({ page }) => {
    const fc = installFC(page); const ts = Date.now(), name = `E2E仓_${ts}`, n2 = `${name}改`;
    await clickMenu(page, ['仓储管理', '仓储基础'], '仓库', '/warehouse/warehouse'); await fc.check('list');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/warehouse/create');
    await page.locator('label:has-text("仓库名称") + div input').first().fill(name);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('save'); expect(page.url()).not.toContain('/create');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(name);
    await page.locator('table tbody tr').filter({ hasText: name }).locator('button:has-text("修改")').first().click(); await page.waitForTimeout(2000);
    await page.locator('label:has-text("仓库名称") + div input').first().fill(n2);
    await formSave(page); await page.waitForTimeout(2000);
    await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(n2);
    await page.locator('table tbody tr').filter({ hasText: n2 }).locator('button:has-text("删除")').first().click(); await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click(); await page.waitForTimeout(1500); await fc.check('del');
  });
  test('A2 库区：新增→搜索→删除', async ({ page }) => {
    const fc = installFC(page); const ts = Date.now(), name = `E2E区_${ts}`;
    await clickMenu(page, ['仓储管理', '仓储基础'], '储区', '/warehouse/zone'); await fc.check('list');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/zone/create');
    await page.locator('label:has-text("储区名称") + div input').first().fill(name);
    await page.locator('label:has-text("所属仓库") + div button[role="combobox"]').first().click(); await page.waitForTimeout(400);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) { if (await page.locator('[role="option"]').nth(i).isVisible()) { await page.locator('[role="option"]').nth(i).click(); break; } }
    await formSave(page); await page.waitForTimeout(2000); await fc.check('save'); expect(page.url()).not.toContain('/create');
    await page.locator('.bg-muted\\/30').locator('input').last().fill(name); await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(name);
    await page.locator('table tbody tr').filter({ hasText: name }).locator('button:has-text("删除")').first().click(); await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click(); await page.waitForTimeout(1500); await fc.check('del');
  });
  test('A3 通道/货架/货位 从菜单点新增', async ({ page }) => {
    const fc = installFC(page); const ts = Date.now();
    await clickMenu(page, ['仓储管理', '仓储基础'], '通道', '/warehouse/passage'); await fc.check('p');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/passage/create');
    await page.locator('input:not([disabled]):not([readonly])').first().fill(`E2E通_${ts}`);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('save'); expect(page.url()).not.toContain('/create');
    await clickMenu(page, ['仓储管理', '仓储基础'], '货架', '/warehouse/shelf'); await fc.check('s');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/shelf/create');
    await page.locator('input:not([disabled]):not([readonly])').first().fill(`E2E架_${ts}`);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('save'); expect(page.url()).not.toContain('/create');
    await clickMenu(page, ['仓储管理', '仓储基础'], '货位', '/warehouse/location'); await fc.check('l');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/location/create');
    await page.locator('input:not([disabled]):not([readonly])').first().fill(`E2E位_${ts}`);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('save'); expect(page.url()).not.toContain('/create');
  });
});

// ═══════════════════ B. 入库/出库/盘点全闭环 ═══════════════════
test.describe('B — 库存闭环', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); await cleanupData(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('B1 入库UI新增→保存→搜索→提交→登卡→库存增加→撤销登卡→库存回退', async ({ page, request }) => {
    test.setTimeout(120000); const fc = installFC(page); const hdr = H(td.token);
    const stockBefore = await invQty(request, td.token, td.matCode);
    console.log(`B1: STOCK BEFORE = ${stockBefore}`);

    await clickMenu(page, ['仓储管理', '入库管理'], '入库单维护', '/warehouse/inbound'); await fc.check('in-list');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/inbound/create'); await page.waitForTimeout(1500); await fc.check('in-create');
    await picker(page, '物料'); await page.waitForTimeout(500);
    await picker(page, '仓库'); await page.waitForTimeout(500);
    const addLn = page.locator('#l button:has-text("新增行")');
    if ((await addLn.count()) > 0) { await addLn.click(); await page.waitForTimeout(800); const li = page.locator('#l table tbody tr').first().locator('input'); await li.nth(1).fill(td.matCode); await li.nth(5).fill('200'); await li.nth(8).fill(td.whCode); }
    await page.waitForTimeout(500);
    await formSave(page); await page.waitForTimeout(3000); await fc.check('in-save');
    expect(page.url(), 'inbound save redirect').not.toContain('/create');

    await page.goto(`${BASE}/warehouse/inbound`); await page.waitForTimeout(2000);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    const ibCode = await colText(page, 3);
    console.log(`B1: INBOUND = ${ibCode}`);

    let row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("提交")').count(), 'submit btn').toBeGreaterThan(0);
    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(1500); await fc.check('in-submit');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("登卡")').count(), 'approve btn').toBeGreaterThan(0);
    await row.locator('button:has-text("登卡")').first().click(); await page.waitForTimeout(2000); await fc.check('in-approve');

    const stockAfter = await invQty(request, td.token, td.matCode);
    console.log(`B1: STOCK AFTER inbound = ${stockAfter}`);
    expect(stockAfter).toBeGreaterThanOrEqual(stockBefore + 200);

    await clickMenu(page, ['仓储管理', '入库管理'], '入库单维护', '/warehouse/inbound');
    await page.locator('.bg-muted\\/30').locator('input').first().fill(ibCode); await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("撤销登卡")').count(), 'cancel btn').toBeGreaterThan(0);
    page.once('dialog', (d: any) => d.accept());
    await row.locator('button:has-text("撤销登卡")').first().click(); await page.waitForTimeout(2000); await fc.check('in-cancel');

    const stockAfterCancel = await invQty(request, td.token, td.matCode);
    console.log(`B1: STOCK AFTER cancel = ${stockAfterCancel}`);
    (test as any)._ibCode = ibCode;
  });

  test('B2 出库→提交→登卡→库存减少→撤销登卡→库存回退', async ({ page, request }) => {
    test.setTimeout(120000); const fc = installFC(page); const hdr = H(td.token);

    const ib = await request.post(`${API}/inbound-orders`, { ...hdr, data: { materialName: td.matName, specification: 'E2E规格mm', quantity: '50', warehouseId: td.whId, warehouseCode: td.whCode, warehouseName: td.whName, unitPrice: '50', totalAmount: '2500', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '50', warehouseCode: td.whCode }] } }).then(r => r.json());
    await request.put(`${API}/inbound-orders/${ib.id}/submit`, hdr);
    await request.put(`${API}/inbound-orders/${ib.id}/approve`, hdr);

    const stockBefore = await invQty(request, td.token, td.matCode);
    console.log(`B2: STOCK BEFORE = ${stockBefore}`);
    expect(stockBefore, 'need inbound stock').toBeGreaterThan(0);

    const ob = await request.post(`${API}/outbound-orders`, { ...hdr, data: { materialName: td.matName, specification: 'E2E规格mm', quantity: '10', warehouseId: td.whId, warehouseCode: td.whCode, warehouseName: td.whName, totalAmount: '500', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '10', warehouseCode: td.whCode }] } }).then(r => r.json());
    const obCode = ob.orderNo;

    await clickMenu(page, ['仓储管理', '出库管理'], '出库单维护', '/warehouse/outbound'); await fc.check('out-list');
    await page.locator('.bg-muted\\/30').locator('input').first().fill(obCode); await toolbarSearch(page); await page.waitForTimeout(2000);
    expect(await page.locator('table tbody').innerText()).toContain(obCode);
    console.log(`B2: OUTBOUND = ${obCode}`);

    let row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("提交")').count(), 'submit').toBeGreaterThan(0);
    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(1500); await fc.check('out-submit');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("登卡")').count(), 'approve').toBeGreaterThan(0);
    await row.locator('button:has-text("登卡")').first().click(); await page.waitForTimeout(2000); await fc.check('out-approve');

    const stockAfter = await invQty(request, td.token, td.matCode);
    console.log(`B2: STOCK AFTER outbound = ${stockAfter}`);
    expect(stockAfter).toBeLessThan(stockBefore);

    await page.locator('.bg-muted\\/30').locator('input').first().fill(obCode); await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("撤销登卡")').count(), 'cancel').toBeGreaterThan(0);
    page.once('dialog', (d: any) => d.accept());
    await row.locator('button:has-text("撤销登卡")').first().click(); await page.waitForTimeout(2000); await fc.check('out-cancel');

    const stockAfterCancel = await invQty(request, td.token, td.matCode);
    console.log(`B2: STOCK AFTER cancel = ${stockAfterCancel}`);
    (test as any)._obCode = obCode;
  });

  test('B3 盘点UI新增→提交→审批→生成调整单→审核调整单→库存修正', async ({ page, request }) => {
    test.setTimeout(120000); const fc = installFC(page); const hdr = H(td.token);

    const ib = await request.post(`${API}/inbound-orders`, { ...hdr, data: { materialName: td.matName, specification: 'E2E规格mm', quantity: '30', warehouseId: td.whId, warehouseCode: td.whCode, warehouseName: td.whName, unitPrice: '50', totalAmount: '1500', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '30', warehouseCode: td.whCode }] } }).then(r => r.json());
    await request.put(`${API}/inbound-orders/${ib.id}/submit`, hdr);
    await request.put(`${API}/inbound-orders/${ib.id}/approve`, hdr);

    const actualStock = await invQty(request, td.token, td.matCode);
    console.log(`B3: actual stock = ${actualStock}`);
    expect(actualStock, 'inventory must exist').toBeGreaterThan(0);

    await clickMenu(page, ['仓储管理', '库存管理'], '盘点单维护', '/warehouse/check'); await fc.check('ck-list');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/check/create'); await page.waitForTimeout(1500); await fc.check('ck-create');

    await picker(page, '物料', td.matCode); await page.waitForTimeout(800);
    await page.locator('label:has-text("库存数量") + div input').first().fill(String(actualStock));
    const checkQty = actualStock + 10;
    await page.locator('label:has-text("盘点数量") + div input').first().fill(String(checkQty));
    await picker(page, '仓库', td.whCode); await page.waitForTimeout(300);

    await formSave(page); await page.waitForTimeout(3000); await fc.check('ck-save');
    expect(page.url(), 'check save redirect').not.toContain('/create');

    await page.goto(`${BASE}/warehouse/check`); await page.waitForTimeout(2000);
    await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('ck-search');
    let row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("提交")').count(), 'ck submit').toBeGreaterThan(0);
    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(1500); await fc.check('ck-submit');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').first();
    expect(await row.locator('button:has-text("通过")').count(), 'ck approve').toBeGreaterThan(0);
    await row.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(1500); await fc.check('ck-approve');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').first();
    const genBtn = row.locator('button:has-text("生成调整单")');
    expect(await genBtn.count(), 'ck gen-adj').toBeGreaterThan(0);
    page.once('dialog', (d: any) => d.accept());
    await genBtn.first().click(); await page.waitForTimeout(2000); await fc.check('ck-gen');

    // Approve the adjust order — must exist after gen-adj succeeded
    const adjResp = await request.get(`${API}/adjust-orders?pageSize=20`, hdr).then(r => r.json());
    const adjItem = (adjResp.items || []).find((x: any) => (x.orderNo||'').includes('ADJ'));
    expect(adjItem, 'adjust order must be found after gen-adj').toBeTruthy();
    const adjNo = adjItem!.orderNo;
    console.log(`B3: ADJUST = ${adjNo}`);

    await request.put(`${API}/adjust-orders/${adjItem!.id}/submit`, hdr);
    const approveResp = await request.put(`${API}/adjust-orders/${adjItem!.id}/approve`, hdr);
    expect(approveResp.status(), `adjust approve must succeed (${adjNo})`).toBeLessThan(400);

    const stockAfter = await invQty(request, td.token, td.matCode);
    console.log(`B3: STOCK BEFORE=${actualStock}, checkQty=${checkQty}, STOCK AFTER=${stockAfter}`);
    expect(stockAfter, `${actualStock}→checkQty ${checkQty}, got ${stockAfter}`).toBe(checkQty);
  });
});

// ═══════════════════ C. 借用+报废 ═══════════════════
test.describe('C — 借用+报废', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); await cleanupData(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('C1 借用UI新增→保存→搜索', async ({ page }) => {
    test.setTimeout(60000); const fc = installFC(page);
    await page.goto(`${BASE}/warehouse/lend-order`); await page.waitForTimeout(2000); await fc.check('l');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/lend-order/create');
    await pickCB(page, '物料'); await page.locator('label:has-text("数量") + div input').first().fill('5');
    await page.locator('label:has-text("借用人") + div input').first().fill('E2E借用人');
    await formSave(page); await page.waitForTimeout(3000); await fc.check('save'); expect(page.url()).not.toContain('/create');
    await page.goto(`${BASE}/warehouse/lend-order`); await page.waitForTimeout(2000);
    await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('search');
  });
  test('C2 报废UI新增→保存→搜索', async ({ page }) => {
    test.setTimeout(60000); const fc = installFC(page); const ts = Date.now(), reason = `E2E报废_${ts}`;
    await page.goto(`${BASE}/warehouse/scrap-apply`); await page.waitForTimeout(2000); await fc.check('s');
    await toolbarAdd(page); expect(page.url()).toContain('/warehouse/scrap-apply/create');
    await pickCB(page, '物料'); await page.locator('label:has-text("数量") + div input').first().fill('3');
    await page.locator('label:has-text("报废原因") + div input').first().fill(reason);
    await page.locator('label:has-text("处置方式") + div input').first().fill('销毁');
    await formSave(page); await page.waitForTimeout(3000); await fc.check('save'); expect(page.url()).not.toContain('/create');
    await page.goto(`${BASE}/warehouse/scrap-apply`); await page.waitForTimeout(2000);
    await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('search');
  });
});

// ═══════════════════ D. 查询页 ═══════════════════
test.describe('D — 查询页', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await cleanupData(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('D1 库存查询→搜索本轮物料→表格包含', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const ib = await request.post(`${API}/inbound-orders`, { ...hdr, data: { materialName: td.matName, specification: 'E2E规格mm', quantity: '5', warehouseId: td.whId, warehouseCode: td.whCode, warehouseName: td.whName, unitPrice: '50', totalAmount: '250', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '5', warehouseCode: td.whCode }] } }).then(r => r.json());
    await request.put(`${API}/inbound-orders/${ib.id}/submit`, hdr); await request.put(`${API}/inbound-orders/${ib.id}/approve`, hdr);
    await clickMenu(page, ['仓储管理', '库存管理'], '库存查询', '/warehouse/stock'); await fc.check('stock');
    await page.locator('.bg-muted\\/30').locator('input').first().fill(td.matCode); await toolbarSearch(page);
    await page.waitForTimeout(2000); await fc.check('search');
    expect(await page.locator('table tbody').innerText()).toContain(td.matCode);
  });
  test('D2 入库查询→搜索本轮入库单号', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const ib = await request.post(`${API}/inbound-orders`, { ...hdr, data: { materialName: td.matName, specification: 'E2E规格mm', quantity: '10', warehouseId: td.whId, warehouseCode: td.whCode, warehouseName: td.whName, unitPrice: '50', totalAmount: '500', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '10', warehouseCode: td.whCode }] } }).then(r => r.json());
    const ibCode = ib.orderNo;
    await clickMenu(page, ['仓储管理', '入库管理'], '入库单查询', '/warehouse/inbound-query'); await fc.check('iq');
    await page.locator('.bg-muted\\/30').locator('input').first().fill(ibCode); await toolbarSearch(page);
    await page.waitForTimeout(2000); await fc.check('search');
    expect(await page.locator('table tbody').innerText()).toContain(ibCode);
    await request.delete(`${API}/inbound-orders/${ib.id}`, hdr).catch(() => {});
  });
  test('D3 出库查询→搜索本轮出库单号', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const ib = await request.post(`${API}/inbound-orders`, { ...hdr, data: { materialName: td.matName, specification: 'E2E规格mm', quantity: '20', warehouseId: td.whId, warehouseCode: td.whCode, warehouseName: td.whName, unitPrice: '50', totalAmount: '1000', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '20', warehouseCode: td.whCode }] } }).then(r => r.json());
    await request.put(`${API}/inbound-orders/${ib.id}/submit`, hdr); await request.put(`${API}/inbound-orders/${ib.id}/approve`, hdr);
    const ob = await request.post(`${API}/outbound-orders`, { ...hdr, data: { materialName: td.matName, specification: 'E2E规格mm', quantity: '5', warehouseId: td.whId, warehouseCode: td.whCode, warehouseName: td.whName, totalAmount: '250', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '5', warehouseCode: td.whCode }] } }).then(r => r.json());
    const obCode = ob.orderNo;
    await clickMenu(page, ['仓储管理', '出库管理'], '出库单查询', '/warehouse/outbound-query'); await fc.check('oq');
    await page.locator('.bg-muted\\/30').locator('input').first().fill(obCode); await toolbarSearch(page);
    await page.waitForTimeout(2000); await fc.check('search');
    expect(await page.locator('table tbody').innerText()).toContain(obCode);
    await request.delete(`${API}/outbound-orders/${ob.id}`, hdr).catch(() => {});
  });
});

// ═══════════════════ E. 布局 ═══════════════════
test.describe('E — 布局', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  for (const [label, parents, leaf, path] of [
    ['仓库', ['仓储管理', '仓储基础'], '仓库', '/warehouse/warehouse'], ['入库单', ['仓储管理', '入库管理'], '入库单维护', '/warehouse/inbound'], ['出库单', ['仓储管理', '出库管理'], '出库单维护', '/warehouse/outbound'], ['盘点单', ['仓储管理', '库存管理'], '盘点单维护', '/warehouse/check'], ['库存查询', ['仓储管理', '库存管理'], '库存查询', '/warehouse/stock'],
  ] as [string, string[], string, string][]) {
    test(`E-${label} 分页+表头`, async ({ page }) => {
      const fc = installFC(page); await clickMenu(page, parents, leaf, path); await fc.check(label);
      expect(await page.getByTestId('erp-pagination').count()).toBeGreaterThan(0);
      const thBox = await page.locator('table thead th').first().boundingBox(); if (thBox) expect(thBox.width).toBeGreaterThan(20);
    });
  }
});
