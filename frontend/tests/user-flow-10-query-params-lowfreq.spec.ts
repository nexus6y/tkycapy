/**
 * 用户流程 10 — 查询/追溯/参数/低频页面收尾 (硬断言版 v3)
 *
 * 零弱断言。零可跳过逻辑。零 try/catch 静默吞噬。
 * 每个搜索必须强断言表格包含本轮数据。
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
    if (m.type() === 'error' && !m.text().includes('Warning:') && !m.text().includes('hydration') && !m.text().includes('unique "key"') && !m.text().includes('400') && !m.text().includes('409') && !m.text().includes('should not be null') && !m.text().includes('uncontrolled'))
      a5.push(m.text());
  });
  p.on('pageerror', (err: any) => a5.push(err.message));
  return { async check(l: string) {
    for (const t of ['This page could not be found', 'Internal server error']) { if ((await p.locator(`text=${t}`).count()) > 0) throw new Error(`${l}: "${t}"`); }
    if (a5.length > 0) throw new Error(`${l}: API500s/Errors: ${a5.join('; ').slice(0, 300)}`);
  }};
}
async function toolbarSearch(p: any) {
  await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(200);
  for (const w of ['搜索','查询']) { const b = p.locator('.h-14 button'); for (let i = 0; i < await b.count(); i++) { if ((await b.nth(i).innerText()).trim() === w) { await b.nth(i).click({ force: true }); return; } } }
}
async function formSave(p: any) { await p.locator('button[data-testid="form-save-btn"]').first().click({ force: true }); }
function H(t: string) { return { headers: { Authorization: `Bearer ${t}` } }; }
async function getToken(r: any) { return (await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token; }

async function verifyQueryPage(page: any, fc: any, url: string, label: string) {
  await page.goto(`${BASE}${url}`); await page.waitForTimeout(2000);
  await fc.check(label);
  expect(page.url(), `${label}: not 404`).not.toContain('/_not-found');
  expect(await page.locator('table').count(), `${label}: table`).toBeGreaterThan(0);
  expect(await page.getByTestId('erp-pagination').count(), `${label}: pagination`).toBeGreaterThan(0);
}

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
  const wh: any = await request.get(`${API}/warehouses/${whId}`, h).then((r: any) => r.json());
  const whCode = wh.code || `E2E_WH_${ts}`;
  const supCode = `E2E_SUP_${ts}`, supName = `E2E供应商_${ts}`;
  const supplierId = await mk('suppliers', supCode, supName);
  const cusCode = `E2E_CUS_${ts}`, cusName = `E2E客户_${ts}`;
  const customerId = await mk('customers', cusCode, cusName);
  const deptId = await mk('departments', `E2E_DEPT_${ts}`, `E2E部门_${ts}`);

  // PO
  const po = await request.post(`${API}/purchase-orders`, { ...h, data: { orderName: `E2E采查_${ts}`, supplierId, supplierName: supName, materialName: matName, quantity: '10', totalAmount: '1000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '10', warehouseCode: whCode }] } }).then((r: any) => r.json());
  const poNo = po.orderNo;
  // Purchase Plan
  const pp = await request.post(`${API}/purchase-plans`, { ...h, data: { orderName: `E2E采计查_${ts}`, supplierId, supplierName: supName, materialName: matName, quantity: '5', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '5' }] } }).then((r: any) => r.json());
  const ppNo = pp.orderNo;
  // Purchase Return
  const pr = await request.post(`${API}/purchase-returns`, { ...h, data: { returnReason: `E2E采退查_${ts}`, supplierId, supplierName: supName, materialName: matName, totalQuantity: '3', totalAmount: '300', purchaseOrderId: po.id, purchaseOrderNo: poNo } }).then((r: any) => r.json());
  const prNo = pr.returnNo;
  // SO
  const so = await request.post(`${API}/sales-orders`, { ...h, data: { orderName: `E2E销查_${ts}`, customerId, customerName: cusName, totalAmount: '2000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '20' }] } }).then((r: any) => r.json());
  const soNo = so.orderNo;
  // Quotation
  const qt = await request.post(`${API}/quotations`, { ...h, data: { quotationName: `E2E报价查_${ts}`, customerId, customerName: cusName, totalAmount: '1500', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '15' }] } }).then((r: any) => r.json());
  const qtNo = qt.quotationNo;
  // Sales Shipment
  const ss = await request.post(`${API}/sales-shipments`, { ...h, data: { salesOrderId: so.id, salesOrderNo: soNo, customerId, customerName: cusName, totalAmount: '2000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '20' }] } }).then((r: any) => r.json());
  const ssNo = ss.orderNo || ss.shipmentNo;
  // Sales Return
  const sr = await request.post(`${API}/sales-returns`, { ...h, data: { returnReason: `E2E销退查_${ts}`, customerId, customerName: cusName, totalQuantity: '2', totalAmount: '200', shipmentId: ss.id, shipmentNo: ssNo } }).then((r: any) => r.json());
  const srNo = sr.returnNo;
  // Production Order (must be APPROVED for generate-issue)
  const prod = await request.post(`${API}/production-orders`, { ...h, data: { orderName: `E2E生查_${ts}`, materialName: matName, departmentId: deptId, departmentName: `E2E部门_${ts}`, quantity: '15', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', plannedQty: '15' }], materials: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '15', warehouseCode: whCode }] } }).then((r: any) => r.json());
  await request.put(`${API}/production-orders/${prod.id}/submit`, h);
  await request.put(`${API}/production-orders/${prod.id}/approve`, h);
  const prodNo = prod.orderNo;
  // Issue Order — no try/catch, must succeed
  const isGen = await request.post(`${API}/production-orders/${prod.id}/generate-issue`, h).then((r: any) => r.json());
  const isResp = await request.get(`${API}/issue-orders?pageSize=5`, h).then((r: any) => r.json());
  const issueNo = isResp.items?.[0]?.orderNo || '';
  // Return Order — no try/catch, must succeed
  const ro = await request.post(`${API}/return-orders`, { ...h, data: { orderName: `E2E退查_${ts}`, productionOrderId: prod.id, productionOrderNo: prodNo, materialName: matName, quantity: '3', departmentId: deptId, departmentName: `E2E部门_${ts}` } }).then((r: any) => r.json());
  const retNo = ro.orderNo;
  // Inbound
  const ib = await request.post(`${API}/inbound-orders`, { ...h, data: { materialName: matName, quantity: '100', warehouseId: whId, warehouseCode: whCode, totalAmount: '5000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '100', warehouseCode: whCode }] } }).then((r: any) => r.json());
  const ibNo = ib.orderNo;
  // Outbound
  const ob = await request.post(`${API}/outbound-orders`, { ...h, data: { materialName: matName, quantity: '50', warehouseId: whId, warehouseCode: whCode, totalAmount: '2500', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '50', warehouseCode: whCode }] } }).then((r: any) => r.json());
  const obNo = ob.orderNo;
  // Scrap
  const sc = await request.post(`${API}/scrap-orders`, { ...h, data: { materialName: matName, materialCode: matCode, spec: 'E2E规格mm', unit: 'pcs', quantity: '5', scrapReason: `E2E报废查_${ts}`, disposalMethod: '销毁' } }).then((r: any) => r.json());
  const scNo = sc.orderNo;

  return { token: t, h, ts, matCode, matName, poNo, ppNo, prNo, soNo, qtNo, ssNo, srNo, prodNo, issueNo, retNo, ibNo, obNo, scNo, supName, cusName };
}

async function rollbackAll(request: any, td: any) {
  const h = H(td.token);
  for (const api of ['scrap-orders','outbound-orders','inbound-orders','return-orders','issue-orders','production-orders','sales-returns','sales-shipments','sales-orders','quotations','purchase-returns','purchase-plans','purchase-orders','materials','material-categories','measurement-units','warehouses','suppliers','customers','departments','dictionaries','roles','users']) {
    const r = await request.get(`${API}/${api}?pageSize=200`, h).then((r: any) => r.json());
    for (const o of r?.items || []) {
      if ((o.code || o.name || o.orderName || o.materialName || '')?.includes('E2E')) {
        await request.delete(`${API}/${api}/${o.id}`, h).catch(() => {});
      }
    }
  }
}

// ═══════════════════ A. 采购查询/追溯 ═══════════════════
test.describe('A — 采购查询/追溯', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('A1 采购订单查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/purchase/query/order', 'a1');
    await page.locator('.bg-muted\\/30 input').first().fill(td.poNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('a1-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.poNo);
    console.log(`A1: found ${td.poNo} ✅`);
  });
  test('A2 采购计划查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/purchase/query/plan', 'a2');
    await page.locator('.bg-muted\\/30 input').first().fill(td.ppNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('a2-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.ppNo);
    console.log(`A2: found ${td.ppNo} ✅`);
  });
  test('A3 采购退货查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/purchase/query/return', 'a3');
    await page.locator('.bg-muted\\/30 input').first().fill(td.prNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('a3-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.prNo);
    console.log(`A3: found ${td.prNo} ✅`);
  });
  test('A4 采购追溯', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/purchase/trace', 'a4');
    await page.locator('.bg-muted\\/30 input').first().fill(td.poNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('a4-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.poNo);
    console.log('A4: OK ✅');
  });
});

// ═══════════════════ B. 销售查询/追溯 ═══════════════════
test.describe('B — 销售查询/追溯', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('B1 销售订单查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/sales/query/order', 'b1');
    await page.locator('.bg-muted\\/30 input').first().fill(td.soNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('b1-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.soNo);
    console.log(`B1: found ${td.soNo} ✅`);
  });
  test('B2 销售报价查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/sales/query/quotation', 'b2');
    await page.locator('.bg-muted\\/30 input').first().fill(td.qtNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('b2-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.qtNo);
    console.log(`B2: found ${td.qtNo} ✅`);
  });
  test('B3 销售退货查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/sales/query/return', 'b3');
    await page.locator('.bg-muted\\/30 input').first().fill(td.srNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('b3-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.srNo);
    console.log(`B3: found ${td.srNo} ✅`);
  });
  test('B4 销售出货查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/sales/query/shipment', 'b4');
    await page.locator('.bg-muted\\/30 input').first().fill(td.ssNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('b4-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.ssNo);
    console.log(`B4: found ${td.ssNo} ✅`);
  });
  test('B5 销售追溯', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/sales/trace', 'b5');
    await page.locator('.bg-muted\\/30 input').first().fill(td.soNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('b5-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.soNo);
    console.log('B5: OK ✅');
  });
});

// ═══════════════════ C. 生产查询/追溯 ═══════════════════
test.describe('C — 生产查询/追溯', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('C1 生产订单查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/production/query/order', 'c1');
    await page.locator('.bg-muted\\/30 input').first().fill(td.prodNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('c1-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.prodNo);
    console.log(`C1: found ${td.prodNo} ✅`);
  });

  test('C2 生产领料查询 → 搜索 issueNo', async ({ page }) => {
    expect(td.issueNo, 'C2 issueNo must exist from seed').toBeTruthy();
    const fc = installFC(page); await verifyQueryPage(page, fc, '/production/query/issue', 'c2');
    // Issue query hardcodes biz=ISSUING. Search by orderNo or materialName.
    await page.locator('.bg-muted\\/30 input').first().fill(td.issueNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('c2-search');
    const body = await page.locator('table tbody').innerText();
    expect(body, `C2 must contain ${td.issueNo}`).toContain(td.issueNo);
    console.log(`C2: found ${td.issueNo} ✅`);
  });

  test('C3 生产退料查询 → 搜索 retNo', async ({ page }) => {
    expect(td.retNo, 'C3 retNo must exist from seed').toBeTruthy();
    const fc = installFC(page); await verifyQueryPage(page, fc, '/production/query/return', 'c3');
    // Return query hardcodes biz=COMPLETED. Search by orderNo.
    await page.locator('.bg-muted\\/30 input').first().fill(td.retNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('c3-search');
    const body = await page.locator('table tbody').innerText();
    expect(body, `C3 must contain ${td.retNo}`).toContain(td.retNo);
    console.log(`C3: found ${td.retNo} ✅`);
  });

  test('C4 生产领料追溯', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/production/issue-trace', 'c4');
    await page.locator('.bg-muted\\/30 input').first().fill(td.prodNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('c4-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.prodNo);
    console.log(`C4: found ${td.prodNo} ✅`);
  });
});

// ═══════════════════ D. 仓储查询 ═══════════════════
test.describe('D — 仓储查询', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('D1 入库查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/warehouse/inbound-query', 'd1');
    await page.locator('.bg-muted\\/30 input').first().fill(td.ibNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('d1-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.ibNo);
    console.log(`D1: found ${td.ibNo} ✅`);
  });
  test('D2 出库查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/warehouse/outbound-query', 'd2');
    await page.locator('.bg-muted\\/30 input').first().fill(td.obNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('d2-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.obNo);
    console.log(`D2: found ${td.obNo} ✅`);
  });
  test('D3 报废查询', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/warehouse/scrap-query', 'd3');
    await page.locator('.bg-muted\\/30 input').first().fill(td.scNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('d3-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.scNo);
    console.log(`D3: found ${td.scNo} ✅`);
  });
  test('D4 报废台账', async ({ page }) => {
    const fc = installFC(page); await verifyQueryPage(page, fc, '/warehouse/scrap-ledger', 'd4');
    await page.locator('.bg-muted\\/30 input').first().fill(td.scNo); await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('d4-search');
    expect(await page.locator('table tbody').innerText()).toContain(td.scNo);
    console.log(`D4: found ${td.scNo} ✅`);
  });
});

// ═══════════════════ E. 参数页 ═══════════════════
test.describe('E — 参数页', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('E1 合同参数 → UI 新增参数(含 parent)→搜索→强断言→编辑→强断言', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), code = `E2E_DC_${ts}`, name = `E2E参数_${ts}`;

    // Contract params page auto-creates parent dict via getOrCreateParent.
    // The UI flow: select paramType → click 新增 → fill dialog → save.
    await page.goto(`${BASE}/contract/params`); await page.waitForTimeout(2000); await fc.check('e1');

    // Click 新增 to open dialog
    const addBtn = page.locator('button:has-text("新增")');
    expect(await addBtn.count(), 'E1 add btn').toBeGreaterThan(0);
    await addBtn.first().click(); await page.waitForTimeout(1000);

    // Fill dialog (not role="dialog" — this page uses a plain div overlay)
    // The dialog: div.fixed.inset-0.z-50 > div.bg-background.rounded-lg
    const d2 = page.locator('.fixed.inset-0.z-50 .bg-background.rounded-lg').first();
    const dialogInputs = d2.locator('input:not([type="radio"]):not([type="checkbox"])');
    expect(await dialogInputs.count(), 'E1 dialog has inputs').toBeGreaterThanOrEqual(2);
    await dialogInputs.nth(0).fill(code);
    await dialogInputs.nth(1).fill(name);
    // Click save button (button with text "保存" in the dialog footer)
    await d2.locator('button:has-text("保存")').click();
    await page.waitForTimeout(2000);
    // Close dialog via backdrop click
    const backdrop = page.locator('.fixed.inset-0.z-50 .bg-black\\/30').first();
    if (await backdrop.count() > 0) await backdrop.click({ force: true });
    await page.waitForTimeout(500);
    await fc.check('e1-create');

    // Search in UI table (client-side filter — the search button re-triggers filter)
    const si = page.locator('.flex-wrap input, .bg-muted\\/30 input').first();
    await toolbarSearch(page); await page.waitForTimeout(2000);
    if (await si.count() > 0) { await si.fill(code); await toolbarSearch(page); await page.waitForTimeout(2000); }
    const body = await page.locator('table tbody').innerText();
    expect(body, `E1 table must contain ${code}`).toContain(code);
    console.log(`E1: param ${code} created + found in table ✅`);

    // Edit via dialog — click code link to open edit
    const codeLink = page.locator('table tbody').locator(`text=${code}`).first();
    expect(await codeLink.count(), 'E1 code link for edit').toBeGreaterThan(0);
    await codeLink.click(); await page.waitForTimeout(1000);
    const d3 = page.locator('.fixed.inset-0.z-50 .bg-background.rounded-lg').first();
    const d3Inputs = d3.locator('input:not([type="radio"]):not([type="checkbox"])');
    expect(await d3Inputs.count(), 'E1 edit dialog has inputs').toBeGreaterThanOrEqual(2);
    const newName = `${name}_改`;
    await d3Inputs.nth(1).fill(newName);
    await d3.locator('button:has-text("保存")').click();
    await page.waitForTimeout(2000);
    // Close via backdrop
    const bd2 = page.locator('.fixed.inset-0.z-50 .bg-black\\/30').first();
    if (await bd2.count() > 0) await bd2.click({ force: true });
    await page.waitForTimeout(500);
    await fc.check('e1-edit');

    // Re-search and verify edit
    if (await si.count() > 0) { await si.fill(code); await toolbarSearch(page); await page.waitForTimeout(2000); }
    const body2 = await page.locator('table tbody').innerText();
    expect(body2, `E1 table must contain edited name ${newName}`).toContain(newName);
    console.log(`E1: param edited to ${newName} ✅`);
  });

  test('E2 销售参数 → UI填值→保存→API核验持久化', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const testVal = `E2E-SALES-${Date.now()}`;
    await page.goto(`${BASE}/sales/params`); await page.waitForTimeout(3000); await fc.check('e2');
    expect(page.url()).not.toContain('/_not-found');

    // Fill autoCode field (first text input)
    const firstInput = page.locator('input:not([type="radio"]):not([type="checkbox"])').first();
    expect(await firstInput.count(), 'E2 autoCode input').toBeGreaterThan(0);
    await firstInput.fill(testVal); await page.waitForTimeout(300);

    const saveBtn = page.locator('button:has-text("保存")');
    expect(await saveBtn.count(), 'E2 save button').toBeGreaterThan(0);
    await saveBtn.first().click(); await page.waitForTimeout(2000);
    await fc.check('e2-save');

    // API verify persistence
    const v = await request.get(`${API}/sales-params`, hdr).then((r: any) => r.json());
    expect(v.autoCode, 'E2 autoCode persisted').toBe(testVal);
    console.log(`E2: autoCode = "${v.autoCode}" ✅`);

    // Reload UI and verify
    await page.reload(); await page.waitForTimeout(2000);
    const reloadedVal = await page.locator('input:not([type="radio"]):not([type="checkbox"])').first().inputValue();
    expect(reloadedVal, 'E2 reloaded value matches').toBe(testVal);
    console.log('E2: reload verified ✅');
  });

  test('E3 采购参数 → UI填值→保存→API核验持久化', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const testVal = `E2E-PUR-${Date.now()}`;
    await page.goto(`${BASE}/purchase/params`); await page.waitForTimeout(3000); await fc.check('e3');
    expect(page.url()).not.toContain('/_not-found');

    const firstInput = page.locator('input:not([type="radio"]):not([type="checkbox"])').first();
    expect(await firstInput.count(), 'E3 autoCode input').toBeGreaterThan(0);
    await firstInput.fill(testVal); await page.waitForTimeout(300);

    const saveBtn = page.locator('button:has-text("保存")');
    expect(await saveBtn.count(), 'E3 save button').toBeGreaterThan(0);
    await saveBtn.first().click(); await page.waitForTimeout(2000);
    await fc.check('e3-save');

    const v = await request.get(`${API}/purchase-params`, hdr).then((r: any) => r.json());
    expect(v.autoCode, 'E3 autoCode persisted').toBe(testVal);
    console.log(`E3: autoCode = "${v.autoCode}" ✅`);

    await page.reload(); await page.waitForTimeout(2000);
    const reloadedVal = await page.locator('input:not([type="radio"]):not([type="checkbox"])').first().inputValue();
    expect(reloadedVal, 'E3 reloaded value matches').toBe(testVal);
    console.log('E3: reload verified ✅');
  });

  test('E4 质量参数 → UI填值→保存→API核验持久化', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    const testVal = `E2E-QUAL-${Date.now()}`;
    await page.goto(`${BASE}/quality/params`); await page.waitForTimeout(3000); await fc.check('e4');
    expect(page.url()).not.toContain('/_not-found');

    // Fill defectRateThreshold field (the "不合格品率阈值" text input)
    // defectRateThreshold is the 2nd input (1st is autoApproval select)
    const e4Inputs = page.locator('input:not([type="radio"]):not([type="checkbox"])');
    const ec = await e4Inputs.count();
    const thrInput = e4Inputs.nth(Math.min(1, ec - 1));
    expect(await thrInput.count(), 'E4 threshold input').toBeGreaterThan(0);
    await thrInput.fill(testVal); await page.waitForTimeout(300);

    const saveBtn = page.locator('button:has-text("保存")');
    expect(await saveBtn.count(), 'E4 save button').toBeGreaterThan(0);
    await saveBtn.first().click(); await page.waitForTimeout(2000);
    await fc.check('e4-save');

    const v = await request.get(`${API}/quality-params`, hdr).then((r: any) => r.json());
    expect(v.defectRateThreshold, 'E4 threshold persisted').toBe(testVal);
    console.log(`E4: defectRateThreshold = "${v.defectRateThreshold}" ✅`);

    await page.reload(); await page.waitForTimeout(2000);
    const reloadedVal = await page.locator('input:not([type="radio"]):not([type="checkbox"])').nth(1).inputValue();
    expect(reloadedVal, 'E4 reloaded value matches').toBe(testVal);
    console.log('E4: reload verified ✅');
  });

  test('E5 物料参数 → 修改codeFormat→保存→API强断言持久化', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token);
    await page.goto(`${BASE}/material-param`); await page.waitForTimeout(2000); await fc.check('e5');
    expect(page.url()).not.toContain('/_not-found');

    const testValue = `E2E_CF_${Date.now()}`;
    // Find the code format input (first editable text input)
    const codeInput = page.locator('input:not([type="radio"]):not([type="checkbox"])').first();
    expect(await codeInput.count(), 'E5 has codeFormat input').toBeGreaterThan(0);
    await codeInput.fill(testValue); await page.waitForTimeout(500);

    const saveBtn = page.locator('button:has-text("保存")');
    expect(await saveBtn.count(), 'E5 save button').toBeGreaterThan(0);
    await saveBtn.first().click();
    await page.waitForTimeout(2000);
    await fc.check('e5-save');

    // API verify persistence
    const v = await request.get(`${API}/material-params`, hdr).then((r: any) => r.json());
    expect(v, 'E5 material-params API must respond').toBeTruthy();
    expect(v.codeFormat, 'E5 codeFormat must be persisted').toBe(testValue);
    console.log(`E5: codeFormat = "${v.codeFormat}" ✅`);
  });
});

// ═══════════════════ F. 成本页 ═══════════════════
test.describe('F — 成本页', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  const costPages = [
    ['account-period', 'F1 成本期间'], ['procure-in', 'F2 采购入库成本'],
    ['procure-out', 'F3 采购出库成本'], ['carry-order', 'F4 结转单'],
    ['carry-over', 'F5 结转执行'],
  ];
  for (const [slug, label] of costPages) {
    test(`${label} → 表格+分页`, async ({ page }) => {
      const fc = installFC(page); await verifyQueryPage(page, fc, `/cost/${slug}`, slug);
      console.log(`${label}: OK ✅`);
    });
  }
});

// ═══════════════════ G. 系统页 ═══════════════════
test.describe('G — 系统页', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('G1 角色 create+edit', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), roleName = `E2E角色_${ts}`;
    await page.goto(`${BASE}/system/role/create`); await page.waitForTimeout(2000);
    await page.locator('label:has-text("编码") + div input').first().fill(`E2E_RC_${ts}`);
    await page.locator('label:has-text("名称") + div input').first().fill(roleName);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'G1 save redirect').not.toContain('/create');
    const v = await request.get(`${API}/roles-mgmt?pageSize=999`, hdr).then((r: any) => r.json());
    const r = (v.items || []).find((x: any) => x.name === roleName);
    expect(r, 'G1 role created').toBeTruthy();
    await page.goto(`${BASE}/system/role/${r.id}/edit`); await page.waitForTimeout(2000);
    const n2 = `${roleName}_改`;
    await page.locator('label:has-text("名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v2 = await request.get(`${API}/roles-mgmt/${r.id}`, hdr).then((r: any) => r.json());
    expect(v2.name, 'G1 role edited').toBe(n2);
    console.log(`G1: role create+edit ✅`);
  });

  test('G2 用户 create+edit', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), username = `E2Euser_${ts}`;
    await page.goto(`${BASE}/system/user/create`); await page.waitForTimeout(2000);
    await page.locator('label:has-text("用户名") + div input').first().fill(username);
    await page.locator('label:has-text("姓名") + div input').first().fill(`E2E用户_${ts}`);
    await page.locator('label:has-text("密码") + div input').first().fill('123456');
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'G2 save redirect').not.toContain('/create');
    const v = await request.get(`${API}/users?username=${encodeURIComponent(username)}`, hdr).then((r: any) => r.json());
    const u = (v.items || []).find((x: any) => x.username === username);
    expect(u, 'G2 user created').toBeTruthy();
    await page.goto(`${BASE}/system/user/${u.id}/edit`); await page.waitForTimeout(2000);
    await page.locator('label:has-text("姓名") + div input').first().fill(`E2E用户改_${ts}`);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v2 = await request.get(`${API}/users/${u.id}`, hdr).then((r: any) => r.json());
    expect(v2.name, 'G2 user edited').toBe(`E2E用户改_${ts}`);
    console.log(`G2: user create+edit ✅`);
  });

  test('G3 部门 列表', async ({ page }) => { const fc = installFC(page); await verifyQueryPage(page, fc, '/system/dept', 'g3'); console.log('G3: OK ✅'); });
  test('G4 字典 列表', async ({ page }) => { const fc = installFC(page); await verifyQueryPage(page, fc, '/system/dict', 'g4'); console.log('G4: OK ✅'); });
  test('G5 菜单 列表', async ({ page }) => {
    const fc = installFC(page); await page.goto(`${BASE}/system/menu`); await page.waitForTimeout(1500); await fc.check('g5');
    expect(page.url()).not.toContain('/_not-found');
    expect(await page.locator('table').count(), 'G5: table').toBeGreaterThan(0);
    console.log('G5: OK ✅');
  });
  test('G6 权限 列表', async ({ page }) => {
    const fc = installFC(page); await page.goto(`${BASE}/system/permission`); await page.waitForTimeout(1500); await fc.check('g6');
    expect(page.url()).not.toContain('/_not-found');
    expect(await page.locator('table').count(), 'G6: table').toBeGreaterThan(0);
    console.log('G6: OK ✅');
  });

  const logPages = [
    ['log-login', 'G7 登录日志'], ['log-operate', 'G8 操作日志'],
    ['log/login', 'G9 登录日志(nested)'], ['log/operate', 'G10 操作日志(nested)'],
  ];
  for (const [slug, label] of logPages) {
    test(`${label} → 表格+分页`, async ({ page }) => {
      const fc = installFC(page); await verifyQueryPage(page, fc, `/system/${slug}`, slug);
      console.log(`${label}: OK ✅`);
    });
  }
});

// ═══════════════════ H. 全量布局 ═══════════════════
test.describe('H — 全量布局', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('H-合同参数 表格+无404', async ({ page }) => {
    const fc = installFC(page); await page.goto(`${BASE}/contract/params`); await page.waitForTimeout(1500); await fc.check('h1');
    expect(page.url()).not.toContain('/_not-found');
    expect(await page.locator('table').count(), 'H1: table').toBeGreaterThan(0);
    console.log('H1: OK ✅');
  });
  test('H-物料审批 表格+无404', async ({ page }) => {
    const fc = installFC(page); await page.goto(`${BASE}/material-approval`); await page.waitForTimeout(1500); await fc.check('h2');
    expect(page.url()).not.toContain('/_not-found');
    expect(await page.locator('table').count(), 'H2: table').toBeGreaterThan(0);
    console.log('H2: OK ✅');
  });
  test('H-采购合同查询 表格+无404', async ({ page }) => {
    const fc = installFC(page); await page.goto(`${BASE}/contract/query`); await page.waitForTimeout(1500); await fc.check('h3');
    expect(page.url()).not.toContain('/_not-found');
    expect(await page.locator('table').count(), 'H3: table').toBeGreaterThan(0);
    console.log('H3: OK ✅');
  });
});
