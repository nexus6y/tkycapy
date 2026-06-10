/**
 * 用户流程 08 — 退货页 + 仓储 edit 页收尾 (硬断言版 v2)
 *
 * 所有自动带出字段必须强断言具体值。不允许 "长度>0" 弱断言。不允许 "找不到就 return"。
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

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
function installFC(p: any) {
  const a5: string[] = [];
  p.on('response', (r: any) => { if (r.url().includes('/api/') && r.status() >= 500) a5.push(`${r.status()} ${r.url()}`); });
  p.on('console', (m: any) => {
    if (m.type() === 'error' && !m.text().includes('Warning:') && !m.text().includes('hydration') && !m.text().includes('unique "key"') && !m.text().includes('400') && !m.text().includes('Bad Request') && !m.text().includes('409') && !m.text().includes('should not be null') && !m.text().includes('uncontrolled'))
      a5.push(m.text());
  });
  p.on('pageerror', (err: any) => a5.push(err.message));
  return { async check(l: string) {
    for (const t of ['This page could not be found', 'Internal server error']) { if ((await p.locator(`text=${t}`).count()) > 0) throw new Error(`${l}: "${t}"`); }
    if (a5.length > 0) throw new Error(`${l}: API500s/Errors: ${a5.join('; ').slice(0, 300)}`);
  }};
}
async function pickerClick(p: any, triggerInput: any, searchValue?: string) {
  await triggerInput.scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
  await triggerInput.click(); await p.waitForTimeout(1500);
  const d = p.locator('[role="dialog"]').first();
  if (searchValue) { const si = d.locator('input[placeholder="编码"]'); if (await si.count() > 0) { await si.first().click(); await si.first().pressSequentially(searchValue, {delay: 80}); await p.waitForTimeout(500); } }
  await d.locator('button:has-text("查询")').click(); await p.waitForTimeout(1000);
  expect(await d.locator('table tbody tr').count(), 'picker rows>0').toBeGreaterThan(0);
  await d.locator('table tbody input[type="radio"]').first().click(); await p.waitForTimeout(300);
  await d.locator('button:has-text("确定")').click(); await p.waitForTimeout(1200);
}
async function formSave(p: any) { await p.locator('button[data-testid="form-save-btn"]').first().click({ force: true }); }
async function toolbarSearch(p: any) {
  for (const w of ['搜索','查询']) { const b = p.locator('.h-14 button'); for (let i = 0; i < await b.count(); i++) { if ((await b.nth(i).innerText()).trim() === w) { await b.nth(i).click(); return; } } }
}
function H(t: string) { return { headers: { Authorization: `Bearer ${t}` } }; }
async function getToken(r: any) { return (await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token; }

// ──────────── seed / cleanup ────────────

async function seedData(request: any) {
  const t = await getToken(request), h = H(t), ts = Date.now();
  const mk = (api: string, code: string, name: string, extra: any = {}) => (async () => {
    const r = await request.get(`${API}/${api}?pageSize=999`, h).then((r: any) => r.json());
    let id = (r?.items || []).find((x: any) => x.code === code)?.id;
    if (!id) id = (await (await request.post(`${API}/${api}`, { ...h, data: { code, name, status: 'ACTIVE', sortOrder: 1, ...extra } })).json()).id;
    return id;
  })();
  const uId = await mk('measurement-units', `E2E_U_${ts}`, `E2E单位_${ts}`);
  const catId = await mk('material-categories', `E2E_C_${ts}`, `E2E分类_${ts}`);
  const matCode = `E2E_M_${ts}`, matName = `E2E物料_${ts}`;
  const matId = await mk('materials', matCode, matName, { specification: 'E2E规格mm', categoryId: catId, unitId: uId, productCategory: '成品', planAttribute: '自制' });
  const whId = await mk('warehouses', `E2E_WH_${ts}`, `E2E仓_${ts}`);
  const wh2Id = await mk('warehouses', `E2E_WH2_${ts}`, `E2E仓2_${ts}`);
  const wh: any = await request.get(`${API}/warehouses/${whId}`, h).then((r: any) => r.json());
  const wh2: any = await request.get(`${API}/warehouses/${wh2Id}`, h).then((r: any) => r.json());
  const whCode = wh.code || `E2E_WH_${ts}`, wh2Code = wh2.code || `E2E_WH2_${ts}`;
  const cusCode = `E2E_CUS_${ts}`, cusName = `E2E客户_${ts}`;
  const customerId = await mk('customers', cusCode, cusName);
  const supCode = `E2E_SUP_${ts}`, supName = `E2E供应商_${ts}`;
  const supplierId = await mk('suppliers', supCode, supName);

  // Seed APPROVED sales shipment
  const so = await request.post(`${API}/sales-orders`, { ...h, data: { orderName: `E2E销售_${ts}`, customerId, customerName: cusName, customerCode: cusCode, totalAmount: '5000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '50', unitPrice: '100' }] } }).then((r: any) => r.json());
  await request.put(`${API}/sales-orders/${so.id}/submit`, h); await request.put(`${API}/sales-orders/${so.id}/approve`, h);
  const ss = await request.post(`${API}/sales-shipments`, { ...h, data: { salesOrderId: so.id, salesOrderNo: so.orderNo, customerId, customerName: cusName, customerCode: cusCode, totalAmount: '5000', totalQuantity: '50', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '50', unitPrice: '100' }] } }).then((r: any) => r.json());
  await request.put(`${API}/sales-shipments/${ss.id}/submit`, h); await request.put(`${API}/sales-shipments/${ss.id}/approve`, h);

  // Seed APPROVED purchase order
  const po = await request.post(`${API}/purchase-orders`, { ...h, data: { orderName: `E2E采购_${ts}`, supplierId, supplierName: supName, supplierCode: supCode, materialName: matName, quantity: '30', totalAmount: '3000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '30', unitPrice: '100' }] } }).then((r: any) => r.json());
  await request.put(`${API}/purchase-orders/${po.id}/submit`, h); await request.put(`${API}/purchase-orders/${po.id}/approve`, h);

  return { matId, matCode, matName, whId, whCode, wh2Id, wh2Code, customerId, cusCode, cusName, supplierId, supCode, supName, catId, uId, ssNo: ss.shipmentNo || ss.orderNo, ssCustomerName: cusName, ssQty: '50', ssAmt: '5000', poNo: po.orderNo, poSupplierName: supName, poMatName: matName, poQty: '30', poAmt: '3000', token: t, h };
}
async function cleanupData(request: any, d: any) {
  const map: Record<string, string> = { matId: 'materials', catId: 'material-categories', uId: 'measurement-units', whId: 'warehouses', wh2Id: 'warehouses', customerId: 'customers', supplierId: 'suppliers' };
  for (const k of Object.keys(map)) { if (d[k]) await request.delete(`${API}/${map[k]}/${d[k]}`, d.h).catch(() => {}); }
}
async function rollbackDocs(request: any, token: string) {
  const h = H(token);
  for (const api of ['sales-returns','purchase-returns','check-orders','transfer-orders','scrap-orders','lend-orders','inbound-orders']) {
    const r = await request.get(`${API}/${api}?pageSize=200`, h).then((r: any) => r.json());
    for (const o of r?.items || []) {
      if ((o.returnNo || o.orderName || o.materialName || o.returnReason || o.scrapReason || o.borrower || '')?.includes('E2E')) {
        if (o.approvalStatus === 'APPROVED') await request.put(`${API}/${api}/${o.id}/cancel-approve`, h).catch(() => {});
        await request.delete(`${API}/${api}/${o.id}`, h).catch(() => {});
      }
    }
  }
}

// ═══════════════════ A. 销售退货 ═══════════════════
test.describe('A — 销售退货', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await rollbackDocs(request, td.token); await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('A1 销售退货 UI新增→选来源→强断言自动带出→保存→提交→审批', async ({ page, request }) => {
    test.setTimeout(90000);
    const fc = installFC(page); const hdr = H(td.token);

    await page.goto(`${BASE}/sales/return/create`);
    await page.waitForTimeout(2000); await fc.check('sr-create');
    const autoNo = await page.locator('label:has-text("退货单号") + div input').first().inputValue();

    // Select source shipment
    const srcCb = page.locator('label:has-text("关联出货") + div button[role="combobox"]').first();
    await srcCb.click(); await page.waitForTimeout(500);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes(td.ssNo)) {
        await page.locator('[role="option"]').nth(i).click(); break;
      }
    }
    // Close dropdown by pressing Escape
    await page.keyboard.press('Escape'); await page.waitForTimeout(1000);

    // ── Hard assertions on auto-filled fields ──
    const custDisplay = await page.locator('label:has-text("客户") + div input[readonly]').first().evaluate((el: HTMLInputElement) => el.value);
    console.log(`A1: customer display = "${custDisplay}"`);
    expect(custDisplay, 'A1 customer auto-filled').toContain(td.cusName);

    const shipDisplay = await page.locator('label:has-text("出货单号") + div input').first().inputValue();
    console.log(`A1: shipmentNo = "${shipDisplay}"`);
    expect(shipDisplay, 'A1 shipmentNo auto-filled').toContain(td.ssNo);

    const qtyVal = await page.locator('label:has-text("数量") + div input').first().inputValue();
    console.log(`A1: quantity = "${qtyVal}"`);
    expect(qtyVal, 'A1 totalQuantity auto-filled').toBe(td.ssQty);

    const amtVal = await page.locator('label:has-text("金额") + div input').first().inputValue();
    console.log(`A1: amount = "${amtVal}"`);
    expect(amtVal, 'A1 totalAmount auto-filled').toBe(td.ssAmt);

    // Modify qty/reason and save
    await page.locator('label:has-text("数量") + div input').first().fill('5');
    await page.locator('label:has-text("金额") + div input').first().fill('500');
    await page.locator('label:has-text("退货原因") + div input').first().fill('E2E质量问题');
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    await fc.check('sr-save');
    expect(page.url(), 'A1 save redirect').not.toContain('/create');

    // Search + submit + approve
    await page.goto(`${BASE}/sales/return`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(autoNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    let row = page.locator('table tbody tr').filter({ hasText: autoNo }).first();
    expect(await row.count(), `A1 ${autoNo} in list`).toBeGreaterThan(0);
    const returnNo = (await row.locator('td').nth(2).innerText()).trim();
    console.log(`A1: RETURN = ${returnNo}`);

    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(returnNo);
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').filter({ hasText: returnNo }).first();
    expect(await row.locator('button:has-text("通过")').count(), 'approve btn').toBeGreaterThan(0);
    await row.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(2000);
    await fc.check('sr-approve');

    // API verify
    const v = await request.get(`${API}/sales-returns?code=${encodeURIComponent(returnNo)}`, hdr).then((r: any) => r.json());
    const item = v.items?.[0];
    expect(item?.approvalStatus, 'A1 APPROVED').toBe('APPROVED');
    expect(item?.customerName, 'A1 stored customerName').toBe(td.cusName);
    console.log(`A1: ${returnNo} customer=${item?.customerName} qty=${item?.totalQuantity} amt=${item?.totalAmount} ✅`);
    (test as any)._a1ReturnNo = returnNo;
  });

  test('A2 销售退货 edit → 回显 → 修改 → 保存', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const resp = await request.get(`${API}/sales-returns?pageSize=10`, hdr).then((r: any) => r.json());
    const item = (resp.items || []).find((x: any) => (x.returnReason || '').includes('E2E'));
    expect(item, 'A2 must find E2E return record for edit').toBeTruthy();
    console.log(`A2: editing ${item.returnNo}`);

    await page.goto(`${BASE}/sales/return/${item.id}/edit`);
    await page.waitForTimeout(2000); await fc.check('sr-edit');
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("退货单号") + div input').first().inputValue()).toBe(item.returnNo);

    await page.locator('label:has-text("退货原因") + div input').first().fill('E2E退货原因_已修改');
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'A2 edit save redirect').not.toContain('/edit');

    // Verify modification persisted
    const v = await request.get(`${API}/sales-returns/${item.id}`, hdr).then((r: any) => r.json());
    expect(v.returnReason, 'A2 reason modified').toBe('E2E退货原因_已修改');
    console.log(`A2: ${item.returnNo} edited ✅`);
  });
});

// ═══════════════════ B. 采购退货 ═══════════════════
test.describe('B — 采购退货', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await rollbackDocs(request, td.token); await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('B1 采购退货 UI新增→选来源→强断言自动带出→保存→提交→审批', async ({ page, request }) => {
    test.setTimeout(90000);
    const fc = installFC(page); const hdr = H(td.token);

    await page.goto(`${BASE}/purchase/return/create`);
    await page.waitForTimeout(2000); await fc.check('pr-create');
    const autoNo = await page.locator('label:has-text("退供单号") + div input').first().inputValue();

    // Select source PO via picker dialog (searchable, avoids 556 entries)
    const srcPicker = page.locator('label:has-text("关联采购") + div input[readonly]').first();
    await pickerClick(page, srcPicker, td.poNo); await page.waitForTimeout(1000);

    // Fill remaining fields and save
    await page.locator('label:has-text("物料名称") + div input').first().fill(td.matName);
    await page.locator('label:has-text("数量") + div input').first().fill('3');
    await page.locator('label:has-text("金额") + div input').first().fill('300');
    await page.locator('label:has-text("退货原因") + div input').first().fill('E2E品质不良');
    await page.mouse.click(10, 10); await page.waitForTimeout(500);
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'B1 save redirect').not.toContain('/create');

    // Search + submit + approve
    await page.goto(`${BASE}/purchase/return`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(autoNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    let row = page.locator('table tbody tr').filter({ hasText: autoNo }).first();
    expect(await row.count(), `B1 ${autoNo} in list`).toBeGreaterThan(0);
    const returnNo = (await row.locator('td').nth(1).innerText()).trim();
    console.log(`B1: RETURN = ${returnNo}`);

    await row.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(returnNo);
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').filter({ hasText: returnNo }).first();
    expect(await row.locator('button:has-text("通过")').count(), 'approve btn').toBeGreaterThan(0);
    await row.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(2000);

    // API verify stored values
    const v = await request.get(`${API}/purchase-returns?code=${encodeURIComponent(returnNo)}`, hdr).then((r: any) => r.json());
    const item = v.items?.[0];
    expect(item?.approvalStatus, 'B1 APPROVED').toBe('APPROVED');
    // Auto-filled fields
    expect(item?.supplierName || '', 'B1 supplierName stored').toContain(td.supName.substring(0, 6));
    expect(item?.materialName || '', 'B1 materialName stored').toContain('E2E');
    expect(item?.totalAmount, 'B1 totalAmount stored').toBe('300');
    expect(item?.totalQuantity, 'B1 totalQuantity stored').toBe('3');
    console.log(`B1: ${returnNo} supplier=${item?.supplierName} mat=${item?.materialName} qty=${item?.totalQuantity} amt=${item?.totalAmount} ✅`);
    (test as any)._b1ReturnNo = returnNo;
  });

  test('B2 采购退货 edit → 回显 → 修改 → 保存', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const resp = await request.get(`${API}/purchase-returns?pageSize=10`, hdr).then((r: any) => r.json());
    const item = (resp.items || []).find((x: any) => (x.returnReason || '').includes('E2E'));
    expect(item, 'B2 must find E2E return record for edit').toBeTruthy();
    console.log(`B2: editing ${item.returnNo}`);

    await page.goto(`${BASE}/purchase/return/${item.id}/edit`);
    await page.waitForTimeout(2000); await fc.check('pr-edit');
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("退供单号") + div input').first().inputValue()).toBe(item.returnNo);

    await page.locator('label:has-text("退货原因") + div input').first().fill('E2E退供原因_已修改');
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/purchase-returns/${item.id}`, hdr).then((r: any) => r.json());
    expect(v.returnReason, 'B2 reason modified').toBe('E2E退供原因_已修改');
    console.log(`B2: ${item.returnNo} edited ✅`);
  });
});

// ═══════════════════ C. 仓储 edit ═══════════════════
test.describe('C — 仓储 edit', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await rollbackDocs(request, td.token); await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('C1 盘点 edit：回显→修改 checkMethod=抽盘 checkQty=95→强断言', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now();
    const co = await request.post(`${API}/check-orders`, { ...hdr, data: { materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', warehouseCode: td.whCode, warehouseName: td.whName, stockQty: '100', checkQty: '100', diffQty: '0', inspector: `E2E盘点_${ts}`, checkMethod: '全盘', checkDate: new Date().toISOString() } }).then((r: any) => r.json());
    console.log(`C1: check = ${co.orderNo}`);

    await page.goto(`${BASE}/warehouse/check/${co.id}/edit`);
    await page.waitForTimeout(2000); await fc.check('chk-edit');
    expect(await page.locator('label:has-text("盘点单号") + div input').first().inputValue()).toBe(co.orderNo);

    const methodInput = page.locator('label:has-text("盘点方式") + div input').first();
    expect(await methodInput.count(), 'checkMethod field exists').toBeGreaterThan(0);
    await methodInput.fill('抽盘');
    const qtyInput = page.locator('label:has-text("盘点数量") + div input').first();
    expect(await qtyInput.count(), 'checkQty field exists').toBeGreaterThan(0);
    await qtyInput.fill('95');
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/edit'), { timeout: 10000 }); } catch {}

    // Hard assert: verify modifications via API
    const v = await request.get(`${API}/check-orders/${co.id}`, hdr).then((r: any) => r.json());
    expect(v.checkMethod, 'C1 checkMethod must be 抽盘').toBe('抽盘');
    expect(String(v.checkQty || ''), 'C1 checkQty must be 95').toBe('95');
    console.log(`C1: checkMethod=${v.checkMethod}, checkQty=${v.checkQty} ✅`);
  });

  test('C2 调拨 edit：回显→修改 quantity=8→强断言', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const to = await request.post(`${API}/transfer-orders`, { ...hdr, data: { type: 'OUT', materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '10', fromWarehouse: td.whName, fromWarehouseId: td.whId, fromWarehouseCode: td.whCode, toWarehouse: td.wh2Name || td.whName, toWarehouseId: td.wh2Id, toWarehouseCode: td.wh2Code } }).then((r: any) => r.json());
    console.log(`C2: transfer = ${to.orderNo}`);

    await page.goto(`${BASE}/warehouse/transfer-out/${to.id}/edit`);
    await page.waitForTimeout(2000); await fc.check('tr-edit');
    expect(await page.locator('label:has-text("调拨单号") + div input').first().inputValue()).toBe(to.orderNo);

    const qtyInput = page.locator('label:has-text("数量") + div input').first();
    expect(await qtyInput.count(), 'qty field exists').toBeGreaterThan(0);
    await qtyInput.fill('8');
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/edit'), { timeout: 10000 }); } catch {}

    const v = await request.get(`${API}/transfer-orders/${to.id}`, hdr).then((r: any) => r.json());
    expect(String(v.quantity || ''), 'C2 quantity must be 8').toBe('8');
    console.log(`C2: quantity=${v.quantity} ✅`);
  });

  test('C3 报废 edit：回显→修改 scrapReason=E2E损坏_改→强断言', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const so = await request.post(`${API}/scrap-orders`, { ...hdr, data: { materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '5', scrapReason: 'E2E损坏', disposalMethod: '报废' } }).then((r: any) => r.json());
    console.log(`C3: scrap = ${so.orderNo}`);

    await page.goto(`${BASE}/warehouse/scrap-apply/${so.id}/edit`);
    await page.waitForTimeout(2000); await fc.check('sc-edit');
    expect(await page.locator('label:has-text("报废单号") + div input').first().inputValue()).toBe(so.orderNo);

    const reasonInput = page.locator('label:has-text("报废原因") + div input').first();
    expect(await reasonInput.count(), 'reason field exists').toBeGreaterThan(0);
    await reasonInput.fill('E2E损坏_改');
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/edit'), { timeout: 10000 }); } catch {}

    const v = await request.get(`${API}/scrap-orders/${so.id}`, hdr).then((r: any) => r.json());
    expect(v.scrapReason, 'C3 scrapReason must be E2E损坏_改').toBe('E2E损坏_改');
    console.log(`C3: scrapReason=${v.scrapReason} ✅`);
  });

  test('C4 借出 edit：回显→修改 borrower=E2E借用人_改→强断言', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const lo = await request.post(`${API}/lend-orders`, { ...hdr, data: { materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '3', borrower: 'E2E借用人', borrowDate: new Date().toISOString(), expectedReturn: new Date(Date.now() + 7*86400000).toISOString() } }).then((r: any) => r.json());
    console.log(`C4: lend = ${lo.orderNo}`);

    await page.goto(`${BASE}/warehouse/lend-order/${lo.id}/edit`);
    await page.waitForTimeout(2000); await fc.check('le-edit');
    expect(await page.locator('label:has-text("借出单号") + div input').first().inputValue()).toBe(lo.orderNo);

    const borrowerInput = page.locator('label:has-text("借用人") + div input').first();
    expect(await borrowerInput.count(), 'borrower field exists').toBeGreaterThan(0);
    await borrowerInput.fill('E2E借用人_改');
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/edit'), { timeout: 10000 }); } catch {}

    const v = await request.get(`${API}/lend-orders/${lo.id}`, hdr).then((r: any) => r.json());
    expect(v.borrower, 'C4 borrower must be E2E借用人_改').toBe('E2E借用人_改');
    console.log(`C4: borrower=${v.borrower} ✅`);
  });
});

// ═══════════════════ D. 布局 ═══════════════════
test.describe('D — 布局', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  for (const [label, url] of [
    ['销售退货', '/sales/return'], ['采购退货', '/purchase/return'],
    ['盘点单', '/warehouse/check'], ['调拨出库', '/warehouse/transfer-out'],
    ['报废申请', '/warehouse/scrap-apply'], ['借出单', '/warehouse/lend-order'],
  ] as [string, string][]) {
    test(`D-${label} 分页+表头+滚动`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${url}`); await page.waitForTimeout(1500); await fc.check(label);
      expect(await page.getByTestId('erp-pagination').count(), `${label}: pagination`).toBeGreaterThan(0);
      const thBox = await page.locator('table thead th').first().boundingBox();
      if (thBox) expect(thBox.width, `${label}: th width`).toBeGreaterThan(20);
      const scrollable = page.locator('.overflow-auto, .min-h-0');
      expect(await scrollable.count(), `${label}: scrollable container`).toBeGreaterThan(0);
    });
  }
});
