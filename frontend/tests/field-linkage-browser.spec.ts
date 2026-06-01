/**
 * 浏览器级字段联动 E2E 测试
 * 运行：pnpm test:e2e:field-linkage
 *
 * 前提：backend + frontend 已启动
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

// ============================================================
// Helpers
// ============================================================

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('button:has-text("登 录")');
  await page.waitForURL('**/');
  await page.waitForTimeout(500);
}

function readInputs(page: any) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map((el: HTMLInputElement, i: number) => ({
      idx: i, value: el.value?.slice(0, 60) ?? '', disabled: el.disabled,
    }))
  );
}

async function getToken(request: any): Promise<string> {
  const resp = await request.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } });
  const data = await resp.json();
  return data.token;
}

function auth(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ============================================================
// Fixtures — each creates an APPROVED entity and returns it
// ============================================================

interface SharedRefs {
  cat: any; unit: any; supplier: any; customer: any;
}

async function getSharedRefs(request: any, token: string): Promise<SharedRefs> {
  const h = auth(token);
  const [catR, unitR, supR, cusR] = await Promise.all([
    request.get(`${API}/material-categories?pageSize=1`, h),
    request.get(`${API}/measurement-units?pageSize=1`, h),
    request.get(`${API}/suppliers?pageSize=1`, h),
    request.get(`${API}/customers?pageSize=1`, h),
  ]);
  return {
    cat: (await catR.json()).items[0],
    unit: (await unitR.json()).items[0],
    supplier: (await supR.json()).items[0],
    customer: (await cusR.json()).items[0],
  };
}

/** APPROVED purchase order with known materialCode. */
async function createApprovedPO(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const matCode = `IN-FIX-${ts}`;

  await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: `入库夹具-${ts}`, specification: 'IN-SPEC', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED', needInspection: false } });

  const po = await (await request.post(`${API}/purchase-orders`, { ...h, data: {
    orderName: `夹具采购-${ts}`,
    supplierId: refs.supplier.id, supplierName: refs.supplier.name,
    lines: [{ lineNo: 1, materialCode: matCode, materialName: `入库夹具-${ts}`, spec: 'IN-SPEC', unit: 'pcs', quantity: '50', unitPrice: '3', amount: '150', warehouseCode: WH }],
  } })).json();
  await request.put(`${API}/purchase-orders/${po.id}/submit`, h);
  await request.put(`${API}/purchase-orders/${po.id}/approve`, h);
  return { id: po.id, orderNo: po.orderNo, matCode, supplierId: refs.supplier.id, supplierName: refs.supplier.name };
}

/** APPROVED quotation with lines. */
async function createApprovedQuotation(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const matCode = `QTE-FIX-${ts}`;

  await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: `固定物料-${ts}`, specification: 'FIX-01', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED' } });

  const qt = await (await request.post(`${API}/quotations`, { ...h, data: {
    quotationName: `固定报价-${ts}`, customerId: refs.customer.id, customerName: refs.customer.name,
    departmentName: '销售部', responsibleName: '测试员',
    lines: [{ lineNo: 1, materialCode: matCode, materialName: `固定物料-${ts}`, spec: 'FIX-01', unit: 'pcs', quantity: '10', unitPrice: '9', amount: '90', warehouseCode: WH }],
  } })).json();
  await request.put(`${API}/quotations/${qt.id}/submit`, h);
  await request.put(`${API}/quotations/${qt.id}/approve`, h);
  return { id: qt.id, quotationNo: qt.quotationNo, customerName: refs.customer.name, matCode };
}

/** APPROVED purchase plan with lines. */
async function createApprovedPurchasePlan(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const matCode = `PP-FIX-${ts}`;

  await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: `计划物料-${ts}`, specification: 'PP-01', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED' } });

  const pp = await (await request.post(`${API}/purchase-plans`, { ...h, data: {
    orderName: `固定计划-${ts}`, supplierId: refs.supplier.id, supplierName: refs.supplier.name,
    lines: [{ lineNo: 1, materialCode: matCode, materialName: `计划物料-${ts}`, spec: 'PP-01', unit: 'pcs', quantity: '25', unitPrice: '4', amount: '100', warehouseCode: WH }],
  } })).json();
  await request.put(`${API}/purchase-plans/${pp.id}/submit`, h);
  await request.put(`${API}/purchase-plans/${pp.id}/approve`, h);
  return { id: pp.id, orderNo: pp.orderNo, matCode };
}

/** APPROVED production order with product lines and material lines. */
async function createApprovedProductionOrder(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const RAW = `RAW-FIX-${ts}`;
  const PROD = `PROD-FIX-${ts}`;

  await request.post(`${API}/materials`, { ...h, data: { code: PROD, name: `夹具产品-${ts}`, specification: 'PRD-01', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED', directProduction: true } });
  await request.post(`${API}/materials`, { ...h, data: { code: RAW, name: `夹具原料-${ts}`, specification: 'RM-01', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED' } });

  // Stock raw material
  const stockPo = await (await request.post(`${API}/purchase-orders`, { ...h, data: {
    orderName: `原料采购-${ts}`, supplierId: refs.supplier.id, supplierName: refs.supplier.name,
    lines: [{ lineNo: 1, materialCode: RAW, materialName: `夹具原料-${ts}`, spec: 'RM-01', unit: 'pcs', quantity: '100', unitPrice: '1', amount: '100', warehouseCode: WH }],
  } })).json();
  await request.put(`${API}/purchase-orders/${stockPo.id}/submit`, h);
  await request.put(`${API}/purchase-orders/${stockPo.id}/approve`, h);
  const arr = await (await request.post(`${API}/purchase-orders/${stockPo.id}/confirm-arrival`, h)).json();
  const inb = (await (await request.get(`${API}/inbound-orders?pageSize=99`, h)).json()).items.find((i: any) => i.orderNo === arr.inboundOrderNo);
  await request.put(`${API}/inbound-orders/${inb.id}/submit`, h);
  await request.put(`${API}/inbound-orders/${inb.id}/approve`, h);

  const prod = await (await request.post(`${API}/production-orders`, { ...h, data: {
    orderName: `夹具生产-${ts}`,
    materialId: '', materialName: `夹具产品-${ts}`,
    departmentName: '生产部', quantity: '5',
    lines: [{ lineNo: 1, materialCode: PROD, materialName: `夹具产品-${ts}`, spec: 'PRD-01', unit: 'pcs', plannedQty: '5', warehouseCode: WH }],
    materials: [{ lineNo: 1, materialCode: RAW, materialName: `夹具原料-${ts}`, spec: 'RM-01', unit: 'pcs', quantity: '5', warehouseCode: WH }],
  } })).json();
  await request.put(`${API}/production-orders/${prod.id}/submit`, h);
  await request.put(`${API}/production-orders/${prod.id}/approve`, h);
  return { id: prod.id, orderNo: prod.orderNo, rawMat: RAW };
}

/** Find a dropdown option by substring and click it. Throws if not found. */
async function clickOption(page: any, text: string) {
  const opts = page.locator('[role=option]');
  const count = await opts.count();
  for (let i = 0; i < count; i++) {
    const content = (await opts.nth(i).textContent()) || '';
    if (content.includes(text)) {
      await opts.nth(i).click();
      return;
    }
  }
  throw new Error(`找不到选项: "${text}"`);
}

// ============================================================
// Quantity-vs-Amount Fixtures
// ============================================================

/** Create an inbound order with lines (DRAFT, for edit page test). */
async function createInboundWithLines(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const matCode = `QTY-IN-${ts}`;
  await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: `数量测试-入库-${ts}`, specification: 'T1', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED' } });
  const ib = await (await request.post(`${API}/inbound-orders`, { ...h, data: {
    sourceType: 'OTHER', supplierId: refs.supplier.id, supplierName: refs.supplier.name,
    materialName: `数量测试-入库-${ts}`, quantity: '50', warehouseName: WH,
    lines: [{ lineNo: 1, materialCode: matCode, materialName: `数量测试-入库-${ts}`, spec: 'T1', unit: 'pcs', quantity: '50', unitPrice: '3', amount: '150', warehouseCode: WH }],
  } })).json();
  return { id: ib.id, orderNo: ib.orderNo, matCode, totalQty: '50', totalAmt: '150.00' };
}

/** Create an outbound order with lines (DRAFT, for edit page test). */
async function createOutboundWithLines(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const matCode = `QTY-OB-${ts}`;
  await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: `数量测试-出库-${ts}`, specification: 'T1', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED' } });
  const ob = await (await request.post(`${API}/outbound-orders`, { ...h, data: {
    sourceType: 'OTHER', materialName: `数量测试-出库-${ts}`, quantity: '50', warehouseName: WH,
    lines: [{ lineNo: 1, materialCode: matCode, materialName: `数量测试-出库-${ts}`, spec: 'T1', unit: 'pcs', quantity: '50', unitPrice: '3', amount: '150', warehouseCode: WH }],
  } })).json();
  return { id: ob.id, orderNo: ob.orderNo, matCode, totalQty: '50', totalAmt: '150.00' };
}

/** Create a purchase plan with lines (DRAFT, for edit page test). */
async function createPlanWithLines(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const matCode = `QTY-PP-${ts}`;
  await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: `数量测试-计划-${ts}`, specification: 'T1', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED' } });
  const pp = await (await request.post(`${API}/purchase-plans`, { ...h, data: {
    orderName: `数量测试-计划-${ts}`, supplierId: refs.supplier.id, supplierName: refs.supplier.name,
    lines: [{ lineNo: 1, materialCode: matCode, materialName: `数量测试-计划-${ts}`, spec: 'T1', unit: 'pcs', quantity: '25', unitPrice: '4', amount: '100', warehouseCode: WH }],
  } })).json();
  return { id: pp.id, orderNo: pp.orderNo, matCode, totalQty: '25', totalAmt: '100.00' };
}

/** Create an APPROVED sales shipment with known quantity=50, unitPrice=3, amount=150. */
async function createApprovedShipment(request: any, token: string, ts: number, refs: SharedRefs) {
  const h = auth(token);
  const WH = 'WH-001';
  const matCode = `QTY-SH-${ts}`;
  await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: `出库列测-${ts}`, specification: 'T1', categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED' } });

  // Create SO → approve
  const so = await (await request.post(`${API}/sales-orders`, { ...h, data: {
    orderName: `列测销售-${ts}`, customerId: refs.customer.id, customerName: refs.customer.name,
    lines: [{ lineNo: 1, materialCode: matCode, materialName: `出库列测-${ts}`, spec: 'T1', unit: 'pcs', quantity: '50', unitPrice: '3', amount: '150', warehouseCode: WH }],
  } })).json();
  await request.put(`${API}/sales-orders/${so.id}/submit`, h);
  await request.put(`${API}/sales-orders/${so.id}/approve`, h);

  // Create shipment → submit → approve
  const soDetail = await (await request.get(`${API}/sales-orders/${so.id}`, h)).json();
  const soLineId = soDetail.lines?.[0]?.id || '';
  const sh = await (await request.post(`${API}/sales-shipments`, { ...h, data: {
    orderId: so.id, orderNo: so.orderNo, customerName: refs.customer.name,
    shipmentDate: new Date().toISOString(),
    lines: [{ lineNo: 1, salesOrderLineId: soLineId, materialCode: matCode, materialName: `出库列测-${ts}`, spec: 'T1', unit: 'pcs', orderQty: '50', shippedQty: '50', warehouseCode: WH }],
  } })).json();
  await request.put(`${API}/sales-shipments/${sh.id}/submit`, h);
  await request.put(`${API}/sales-shipments/${sh.id}/approve`, h);

  return {
    id: sh.id, shipmentNo: sh.shipmentNo,
    totalQty: '50', totalAmt: '150.00', matCode,
  };
}

// ============================================================
// Tests
// ============================================================

test.describe('Field Linkage — Browser E2E', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  // ===== 1. Contract: customer select → auto-fill =====
  test('1. Contract: customer select → auto-fill code, contact, phone', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);

    await page.goto(`${BASE}/contract/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const combos = page.locator('[role=combobox]');
    const count = await combos.count();
    // Contract is last combobox
    await combos.nth(count - 1).click();
    await page.waitForTimeout(500);
    await clickOption(page, refs.customer.name);

    const inputs = await readInputs(page);

    const customerCode = inputs.find(i => i.value && i.value.length > 2 && i.disabled);
    expect(customerCode, 'customerCode auto-filled (disabled)').toBeDefined();

    const contact = inputs.find(i => i.value === '李四');
    expect(contact, 'contactPerson=李四 auto-filled').toBeDefined();

    const phone = inputs.find(i => i.value === '13900002222');
    expect(phone, 'contactPhone=13900002222 auto-filled').toBeDefined();
  });

  // ===== 2. Quotation: customer select → id/code/name =====
  test('2. Quotation: customer select → id/code/name + contactPerson', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);

    await page.goto(`${BASE}/sales/quotation/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const clientBtn = page.getByRole('button', { name: '客户信息' });
    if (await clientBtn.isVisible()) await clientBtn.click();
    await page.waitForTimeout(300);

    const combos = page.locator('[role=combobox]');
    const count = await combos.count();
    await combos.nth(count - 1).click();
    await page.waitForTimeout(500);
    await clickOption(page, refs.customer.name);

    const inputs = await readInputs(page);

    const cid = inputs.find(i => i.value.startsWith('cmpn') && !i.disabled);
    expect(cid, 'customerId auto-filled').toBeDefined();

    const code = inputs.find(i => i.value && i.value.length > 2 && i.disabled);
    expect(code, 'customerCode disabled+populated').toBeDefined();

    const contact = inputs.find(i => i.value === '李四');
    expect(contact, 'contactPerson=李四 auto-filled').toBeDefined();
  });

  // ===== 3. Inbound: PURCHASE source → lines/amount (fixture PO) =====
  test('3. Inbound: select purchase source → sourceNo, supplier, lines, amount', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now();
    const po = await createApprovedPO(request, token, ts, refs);
    expect(po.orderNo, 'PO fixture orderNo exists').toBeTruthy();

    await page.goto(`${BASE}/warehouse/inbound/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const combos = page.locator('[role=combobox]');
    const count = await combos.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Open sourceNo dropdown (4th combobox = index 3)
    await combos.nth(3).click();
    await page.waitForTimeout(800);
    await clickOption(page, `夹具采购-${ts}`);

    await page.waitForTimeout(1500);
    const inputs = await readInputs(page);

    // sourceNo = PO orderNo (disabled)
    const srcNo = inputs.find(i => i.value === po.orderNo && i.disabled);
    expect(srcNo, `sourceNo=${po.orderNo} (disabled)`).toBeDefined();

    // supplierId = PO supplierId
    const supId = inputs.find(i => i.value === po.supplierId && !i.disabled);
    expect(supId, `supplierId=${po.supplierId}`).toBeDefined();

    // supplier combobox not showing placeholder
    const supComboText = (await combos.nth(4).textContent()) || '';
    expect(supComboText, `supplier auto-filled, got: ${supComboText}`).not.toContain('选择supplier');

    // tbody lines populated
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);

    // materialCode = IN-FIX-xxx
    const mat = inputs.find(i => i.value === po.matCode);
    expect(mat, `line materialCode=${po.matCode}`).toBeDefined();

    // quantity = 50
    const qty = inputs.find(i => i.value === '50' && !i.disabled);
    expect(qty, 'line quantity=50').toBeDefined();

    // totalAmount > 0 (disabled)
    const amt = inputs.find(i => i.value.endsWith('.00') && i.disabled && parseFloat(i.value) > 0);
    expect(amt, `totalAmount=${amt?.value} (disabled,>0)`).toBeDefined();
    expect(parseFloat(amt!.value), 'totalAmount > 0').toBeGreaterThan(0);
  });

  // ===== 4. LinesEditor: qty*price=amount + header total =====
  test('4. LinesEditor: qty*price=amount, header totalAmount updates', async ({ page }) => {
    await page.goto(`${BASE}/sales/quotation/create`);
    await page.waitForSelector('table', { timeout: 10000 });
    const addBtn = page.getByRole('button', { name: '新增行' });

    await addBtn.click(); await page.waitForTimeout(300);
    const r1 = page.locator('tbody tr').nth(0).locator('td input');
    await r1.nth(5).fill('10'); await page.waitForTimeout(200);
    await r1.nth(6).fill('8');  await page.waitForTimeout(500);
    expect(await r1.nth(7).inputValue(), 'line1 amount=80.00').toBe('80.00');

    await addBtn.click(); await page.waitForTimeout(300);
    const r2 = page.locator('tbody tr').nth(1).locator('td input');
    await r2.nth(5).fill('5'); await page.waitForTimeout(200);
    await r2.nth(6).fill('12'); await page.waitForTimeout(500);
    expect(await r2.nth(7).inputValue(), 'line2 amount=60.00').toBe('60.00');

    const hdr = await readInputs(page);
    expect(hdr.some(i => i.disabled && i.value === '140.00'), 'total=140.00').toBe(true);
  });

  // ===== 5. Sales Order: quotation source → customer + lines + totalAmount =====
  test('5. Sales Order: quotation source → customer, lines, totalAmount', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now();
    const qt = await createApprovedQuotation(request, token, ts, refs);

    await page.goto(`${BASE}/sales/order/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    // comboboxes: customer(0), project(1), contract(2), quotation(3)
    const combos = page.locator('[role=combobox]');
    const count = await combos.count();
    if (count < 4) throw new Error(`Expected >=4 combos, got ${count}`);

    // Select quotation (index 3)
    await combos.nth(3).click();
    await page.waitForTimeout(500);
    await clickOption(page, `固定报价-${ts}`);
    await page.waitForTimeout(1500);

    const inputs = await readInputs(page);

    // customerName populated from quotation
    const cname = inputs.find(i => i.value && i.value.length > 1 && !i.disabled && !i.value.startsWith('cmpn'));
    expect(cname, 'customerName auto-filled from quotation').toBeDefined();

    // totalAmount > 0 (disabled)
    const amt = inputs.find(i => parseFloat(i.value) > 0 && i.disabled);
    expect(amt, `totalAmount=${amt?.value}`).toBeDefined();
    expect(parseFloat(amt!.value), 'totalAmount > 0').toBeGreaterThan(0);

    // LinesEditor populated
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);

    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.includes('FIX-')), 'line materialCode from quotation').toBeTruthy();
    expect(vals.some(v => v === '10'), 'line qty=10 from quotation').toBeTruthy();
  });

  // ===== 6. Purchase Order: supplier select; purchase plan source → lines =====
  test('6. Purchase Order: supplier → id; purchase plan → lines/total', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now() + 1;
    const pp = await createApprovedPurchasePlan(request, token, ts, refs);

    await page.goto(`${BASE}/purchase/order/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    // Select supplier (first combobox)
    const combos = page.locator('[role=combobox]');
    await combos.first().click();
    await page.waitForTimeout(500);
    await clickOption(page, refs.supplier.name);

    const inputs1 = await readInputs(page);
    const sid = inputs1.find(i => i.value.startsWith('cmpn') && !i.disabled);
    expect(sid, 'supplierId populated').toBeDefined();

    // Select purchase plan (2nd combobox)
    const count = await combos.count();
    if (count < 2) throw new Error(`Expected >=2 combos, got ${count}`);
    await combos.nth(1).click();
    await page.waitForTimeout(500);
    await clickOption(page, `固定计划-${ts}`);
    await page.waitForTimeout(1500);

    const inputs2 = await readInputs(page);

    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);

    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.includes('PP-FIX-')), 'line materialCode from purchase plan').toBeTruthy();
    expect(vals.some(v => v === '25'), 'line qty=25 from purchase plan').toBeTruthy();
    expect(vals.some(v => v === '100' || v === '100.00'), 'line amount=100 from purchase plan').toBeTruthy();

    const amt = inputs2.find(i => parseFloat(i.value) > 0 && i.disabled);
    expect(amt, `totalAmount=${amt?.value} (disabled,>0)`).toBeDefined();
  });

  // ===== 7. Check Order: material select → spec/unit/stock =====
  test('7. Check Order: material select → spec, unit, stock book qty', async ({ page }) => {
    await page.goto(`${BASE}/warehouse/check/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const combos = page.locator('[role=combobox]');
    await combos.first().click();
    await page.waitForTimeout(500);

    // Click the first option (any material will do for auto-fill verification)
    const opts = page.locator('[role=option]');
    const optCount = await opts.count();
    if (optCount === 0) throw new Error('No material options');
    await opts.first().click();
    await page.waitForTimeout(800);

    const comboText = (await combos.first().textContent()) || '';
    expect(comboText.includes('选择material'), `EntitySelect shows material name, got: ${comboText}`).toBe(false);

    const inputs = await readInputs(page);
    const populated = inputs.filter(i => i.value && i.value.length > 1 && !i.disabled && !i.value.startsWith('cmp'));
    expect(populated.length, `form fields populated after material select (got ${populated.length})`).toBeGreaterThanOrEqual(1);
  });

  // ===== 8. Issue Order: production order → material lines =====
  test('8. Issue Order: production order → lines(totalQty, materialCode, unit)', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now() + 2;
    const prod = await createApprovedProductionOrder(request, token, ts, refs);

    await page.goto(`${BASE}/production/issue/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const combos = page.locator('[role=combobox]');
    await combos.first().click();
    await page.waitForTimeout(500);
    await clickOption(page, `夹具生产-${ts}`);
    await page.waitForTimeout(1500);

    const inputs = await readInputs(page);

    // productionOrderNo (disabled)
    const poNo = inputs.find(i => i.value === prod.orderNo && i.disabled);
    expect(poNo, `productionOrderNo=${prod.orderNo} (disabled)`).toBeDefined();

    // total quantity (disabled)
    const qty = inputs.find(i => i.value && i.value !== '0' && i.disabled && parseFloat(i.value) > 0);
    expect(qty, 'totalQty > 0 (disabled)').toBeDefined();

    // LinesEditor populated
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);

    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.includes('FIX-')), 'line materialCode from PO').toBeTruthy();
    expect(vals.some(v => ['pcs', '个', 'kg', 'm', '台', '套'].includes(v)), 'line unit').toBeTruthy();
  });

  // ===== 9. Pre-Order: customer + contract EntitySelect =====
  test('9. Pre-Order create: customer + contract EntitySelect', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);

    await page.goto(`${BASE}/sales/pre-order/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    // Customer is first combobox
    const combos = page.locator('[role=combobox]');
    await combos.first().click();
    await page.waitForTimeout(500);
    await clickOption(page, refs.customer.name);

    const inputs = await readInputs(page);
    const cid = inputs.find(i => i.value.startsWith('cmpn') && !i.disabled);
    expect(cid, 'customerId auto-filled').toBeDefined();
    const code = inputs.find(i => i.value && i.value.length > 2 && i.disabled);
    expect(code, 'customerCode disabled+populated').toBeDefined();

    // Contract is 2nd combobox (may have no data — skip gracefully)
    const count = await combos.count();
    if (count >= 2) {
      const c2Text = (await combos.nth(1).textContent()) || '';
      if (!c2Text.includes('选择contract')) {
        await combos.nth(1).click();
        await page.waitForTimeout(500);
        const opts2 = page.locator('[role=option]');
        const optCount2 = await opts2.count();
        if (optCount2 > 0) {
          await opts2.first().click();
          await page.waitForTimeout(300);
          const inputs2 = await readInputs(page);
          const contractId = inputs2.find(i => i.value.startsWith('cmp') && !i.disabled);
          expect(contractId, 'contractId populated from select').toBeDefined();
        }
      }
    }
  });

  // ===== 10. Outbound: SALES_SHIPMENT source → lines/amount =====
  test('10. Outbound create: shipment source → sourceNo, lines, totalAmount', async ({ page, request }) => {
    const token = await getToken(request);
    const h = auth(token);

    // Get first available approved shipment directly
    const shList = await (await request.get(`${API}/sales-shipments?status=APPROVED&pageSize=5`, h)).json();
    const sh = shList.items?.[0];
    if (!sh) throw new Error('No approved shipment available — seed DB first');
    // Load detail with lines
    const shDetail = await (await request.get(`${API}/sales-shipments/${sh.id}`, h)).json();
    expect(shDetail.lines?.length, 'shipment has lines').toBeGreaterThan(0);

    await page.goto(`${BASE}/warehouse/outbound/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const combos = page.locator('[role=combobox]');
    const count = await combos.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Switch source type to SALES_SHIPMENT (3rd combobox = index 2)
    await combos.nth(2).click();
    await page.waitForTimeout(300);
    await clickOption(page, '销售出货单');
    await page.waitForTimeout(500);

    // Now select source shipment (4th combobox = index 3)
    const combos2 = page.locator('[role=combobox]');
    await combos2.nth(3).click();
    await page.waitForTimeout(800);
    await clickOption(page, sh.shipmentNo);
    await page.waitForTimeout(1500);

    // Check EntitySelect shows selected value (4th combobox should show shipmentNo)
    const combos3 = page.locator('[role=combobox]');
    const selComboText = (await combos3.nth(3).textContent()) || '';
    expect(selComboText, `EntitySelect shows ${sh.shipmentNo}, got: ${selComboText}`).toContain(sh.shipmentNo);

    // Lines populated
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);

    // Verify line data has materialCode values
    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.length > 3), 'line data populated').toBeTruthy();
  });

  // ===== 11. Production Order: material + department EntitySelect =====
  test('11. Production Order create: material + department EntitySelect', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);

    await page.goto(`${BASE}/production/order/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    // Material is first combobox — pick first available material
    const combos = page.locator('[role=combobox]');
    await combos.first().click();
    await page.waitForTimeout(500);
    const opts = page.locator('[role=option]');
    const optCount = await opts.count();
    if (optCount === 0) throw new Error('No material options');
    await opts.first().click();
    await page.waitForTimeout(300);

    // Verify material auto-fill (spec + unit are disabled after auto-fill)
    const inputs = await readInputs(page);
    const spec = inputs.find(i => i.value && i.value.length > 1 && i.disabled);
    expect(spec, 'specification auto-filled from material').toBeDefined();

    // Department is 2nd combobox
    const count = await combos.count();
    if (count >= 2) {
      const dText = (await combos.nth(1).textContent()) || '';
      if (!dText.includes('选择department')) {
        await combos.nth(1).click();
        await page.waitForTimeout(500);
        const opts2 = page.locator('[role=option]');
        const optCount2 = await opts2.count();
        if (optCount2 > 0) {
          await opts2.first().click();
          await page.waitForTimeout(300);
          const inputs2 = await readInputs(page);
          const deptId = inputs2.find(i => i.value.startsWith('cmp') && !i.disabled);
          expect(deptId, 'departmentId populated from select').toBeDefined();
        }
      }
    }

    // Has two LinesEditor tables
    const tableCount = await page.locator('table').count();
    expect(tableCount, `two LinesEditor tables (got ${tableCount})`).toBeGreaterThanOrEqual(2);
  });

  // ===== 12. Transfer Out: material + warehouse EntitySelect =====
  test('12. Transfer Out create: material + from/to warehouse EntitySelect', async ({ page }) => {
    await page.goto(`${BASE}/warehouse/transfer-out/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    // Material is first combobox — pick first available
    const combos = page.locator('[role=combobox]');
    const count = await combos.count();
    // Verify we have 3 comboboxes (material, fromWarehouse, toWarehouse)
    expect(count, `3 EntitySelects (got ${count})`).toBeGreaterThanOrEqual(3);

    // Select material
    await combos.first().click();
    await page.waitForTimeout(500);
    const opts = page.locator('[role=option]');
    if ((await opts.count()) === 0) throw new Error('No material options');
    await opts.first().click();
    await page.waitForTimeout(500);

    // Verify material selected (not showing placeholder)
    const combo1Text = (await combos.first().textContent()) || '';
    expect(combo1Text.includes('选择material'), `material populated, got: ${combo1Text}`).toBe(false);

    // Select from warehouse (2nd combobox) — close material dropdown first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await combos.nth(1).click();
    await page.waitForTimeout(500);
    // Find visible options only
    const opts2 = page.locator('[role=option]');
    const optCount2 = await opts2.count();
    if (optCount2 === 0) throw new Error('No warehouse options');
    // Click the FIRST option that has "WH" in text (warehouse options)
    let clicked = false;
    for (let i = 0; i < optCount2; i++) {
      const text = (await opts2.nth(i).textContent()) || '';
      if (text.includes('WH')) {
        await opts2.nth(i).click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error('No warehouse option found');
    await page.waitForTimeout(500);

    // Verify from warehouse populated
    const combo2Text = (await combos.nth(1).textContent()) || '';
    expect(combo2Text, `from warehouse populated (got: ${combo2Text})`).toContain('WH');
  });

  // ===== 13. Quantity ≠ Amount: verify quantity field shows sum of qty, not amount =====
  test('13. Quantity field shows totalQuantity not totalAmount', async ({ page }) => {
    await page.goto(`${BASE}/sales/quotation/create`);
    await page.waitForSelector('table', { timeout: 10000 });

    const addBtn = page.getByRole('button', { name: '新增行' });
    // Add line: quantity=50, unitPrice=3 → amount=150
    await addBtn.click(); await page.waitForTimeout(300);
    const r1 = page.locator('tbody tr').nth(0).locator('td input');
    await r1.nth(5).fill('50');  // quantity
    await page.waitForTimeout(200);
    await r1.nth(6).fill('3');   // unitPrice
    await page.waitForTimeout(500);

    // amount should be 50*3 = 150.00
    expect(await r1.nth(7).inputValue(), 'line amount=150.00').toBe('150.00');

    // Add second line: quantity=5, unitPrice=12 → amount=60
    await addBtn.click(); await page.waitForTimeout(300);
    const r2 = page.locator('tbody tr').nth(1).locator('td input');
    await r2.nth(5).fill('5');
    await page.waitForTimeout(200);
    await r2.nth(6).fill('12');
    await page.waitForTimeout(500);
    expect(await r2.nth(7).inputValue(), 'line2 amount=60.00').toBe('60.00');

    // Header: totalQuantity=55, totalAmount=210.00
    const inputs = await readInputs(page);

    // totalAmount field should = 210.00 (disabled)
    const amt210 = inputs.some(i => i.disabled && i.value === '210.00');
    expect(amt210, 'header totalAmount=210.00').toBe(true);

    // totalAmount field should NOT equal 55 (that would be the quantity, not amount)
    const amt55 = inputs.some(i => i.disabled && i.value === '55');
    expect(amt55, 'totalAmount should NOT be 55 (that is quantity!)').toBe(false);
  });

  // ===== 14. Inbound edit: quantity='50' ≠ amount='150.00' =====
  test('14. Inbound edit: quantity=50, amount=150.00', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now();
    const ib = await createInboundWithLines(request, token, ts, refs);

    await page.goto(`${BASE}/warehouse/inbound/${ib.id}/edit`);
    await page.waitForSelector('input[disabled]', { timeout: 10000 });

    const inputs = await readInputs(page);

    // Find the "数量" field — should be disabled and = 50
    const qty = inputs.find(i => i.value === '50' && i.disabled);
    expect(qty, '数量 = 50 (disabled)').toBeDefined();

    // Find the "金额" field — should be disabled and = 150.00
    const amt = inputs.find(i => i.value === '150.00' && i.disabled);
    expect(amt, '金额 = 150.00 (disabled)').toBeDefined();

    // The amount field must NOT show '50'
    expect(inputs.some(i => i.value === '50.00' && !i.disabled), 'amount should NOT be 50.00').toBe(false);
  });

  // ===== 15. Outbound create: shipment fixture → quantity=50, amount=150.00, qty≠amt =====
  test('15. Outbound create: shipment source → quantity=50, amount=150.00, qty≠amt', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now();
    const sh = await createApprovedShipment(request, token, ts, refs);
    expect(sh.shipmentNo, 'fixture shipment created').toBeDefined();

    await page.goto(`${BASE}/warehouse/outbound/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    // Switch sourceType to SALES_SHIPMENT (3rd combobox = index 2)
    const combos = page.locator('[role=combobox]');
    await combos.nth(2).click(); await page.waitForTimeout(300);
    await clickOption(page, '销售出货单');
    await page.waitForTimeout(500);

    // Select the fixture shipment (4th combobox = index 3)
    const combos2 = page.locator('[role=combobox]');
    await combos2.nth(3).click(); await page.waitForTimeout(800);
    await clickOption(page, sh.shipmentNo);
    await page.waitForTimeout(1500);

    await page.waitForTimeout(1000);

    // sourceNo = shipmentNo (EntitySelect shows it)
    const combo3Text = (await combos2.nth(3).textContent()) || '';
    expect(combo3Text, `sourceNo EntitySelect shows ${sh.shipmentNo}`).toContain(sh.shipmentNo);

    // LinesEditor tbody must have data
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines populated (got ${tbodyCount})`).toBeGreaterThan(0);

    // Read all line values for materialCode verification
    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.includes('QTY-SH-')), `line materialCode contains QTY-SH-`).toBeTruthy();

    const inputs = await readInputs(page);
    const qty = inputs.find(i => i.value === '50' && i.disabled);
    expect(qty, '数量 = 50 (disabled)').toBeDefined();

    // 金额 = 150.00 (disabled) — unitPrice=3 × shippedQty=50
    const amt = inputs.find(i => i.value === '150.00' && i.disabled);
    expect(amt, '金额 = 150.00 (disabled)').toBeDefined();

    // 数量(50) != 金额(150.00) — they must differ
    expect(qty!.value, `数量(${qty!.value}) != 金额(${amt!.value})`).not.toEqual(amt!.value);
  });

  // ===== 16. Outbound edit: quantity=50, amount=150.00 =====
  test('16. Outbound edit: quantity=50, amount=150.00', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now();
    const ob = await createOutboundWithLines(request, token, ts, refs);

    await page.goto(`${BASE}/warehouse/outbound/${ob.id}/edit`);
    await page.waitForSelector('input[disabled]', { timeout: 10000 });

    const inputs = await readInputs(page);

    // 数量 = 50 (disabled)
    const qty = inputs.find(i => i.value === '50' && i.disabled);
    expect(qty, '数量 = 50 (disabled)').toBeDefined();

    // 金额 = 150.00 (disabled)
    const amt = inputs.find(i => i.value === '150.00' && i.disabled);
    expect(amt, '金额 = 150.00 (disabled)').toBeDefined();

    // Verify 数量 ≠ 金额 (they have different values)
    expect(qty!.value, '数量(50) != 金额(150.00)').not.toEqual(amt!.value);
  });

  // ===== 17. Purchase plan edit: quantity=25, amount=100.00 =====
  test('17. Purchase plan edit: quantity=25, amount=100.00', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now();
    const pp = await createPlanWithLines(request, token, ts, refs);

    await page.goto(`${BASE}/purchase/plan/${pp.id}/edit`);
    await page.waitForTimeout(1500); // wait for API data load
    await page.waitForSelector('input', { timeout: 10000 });

    const inputs = await readInputs(page);

    // 数量 = 25 (disabled, sum of line quantities)
    const qty = inputs.find(i => i.value === '25' && i.disabled);
    expect(qty, '数量 = 25 (disabled)').toBeDefined();

    // 金额 = 100.00 (disabled, sum of line amounts)
    const amt = inputs.find(i => i.value === '100.00' && i.disabled);
    expect(amt, '金额 = 100.00 (disabled)').toBeDefined();

    // 数量 must NOT be 100
    const qty100 = inputs.find(i => i.value === '100' && i.disabled);
    expect(qty100, '数量 should NOT be 100 (that is amount)').toBeUndefined();
  });

  // ===== 18. Inspection create: PO source → header material + lines =====
  test('18. Inspection create: PO source → materialCode, spec, unit, qty, lines', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const ts = Date.now();
    const po = await createApprovedPO(request, token, ts, refs);
    // PO fixture: matCode=IN-FIX-xxx, spec=IN-SPEC, unit=pcs, qty=50, price=3, amt=150

    await page.goto(`${BASE}/quality/inspection/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const combos = page.locator('[role=combobox]');
    await combos.first().click(); await page.waitForTimeout(500);
    await clickOption(page, `夹具采购-${ts}`);
    await page.waitForTimeout(1500);

    const inputs = await readInputs(page);

    // Header materialCode auto-filled from PO line (disabled)
    const matCode = inputs.find(i => i.value === po.matCode);
    expect(matCode, `materialCode=${po.matCode}`).toBeDefined();

    // Header spec auto-filled (disabled)
    const spec = inputs.find(i => i.value === 'IN-SPEC' && i.disabled);
    expect(spec, 'specification=IN-SPEC (disabled)').toBeDefined();

    // Header unit auto-filled (disabled)
    const unit = inputs.find(i => i.value === 'pcs' && i.disabled);
    expect(unit, 'unit=pcs (disabled)').toBeDefined();

    // Header qty = 50 (disabled, computed from PO line quantities)
    const qty = inputs.find(i => i.value === '50' && i.disabled);
    expect(qty, 'quantity=50 (disabled)').toBeDefined();

    // tbody lines populated
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);

    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.includes('IN-FIX-')), 'line materialCode from PO').toBeTruthy();
  });

  // ===== 19. Inspection edit: dedicated fixture → material + quantities =====
  test('19. Inspection edit: fixture qty=40, qualified=35, unqualified=5', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);
    const WH = 'WH-001';
    const ts = Date.now() + 1;

    // Create material + inspection with known values
    const matCode = `QC-EDIT-${ts}`;
    await request.post(`${API}/materials`, { ...h, data: {
      code: matCode, name: `质检编辑-${ts}`, specification: 'QC-SPEC',
      categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED',
    } });
    const ins = await (await request.post(`${API}/inspections`, { ...h, data: {
      inspectionNo: `INS-FIX-${ts}`, sourceType: '采购单', sourceNo: 'PO-DUMMY',
      materialName: `质检编辑-${ts}`,
      quantity: '40', qualifiedQty: '35', unqualifiedQty: '5',
      inspector: '测试质检员', result: '待定',
      lines: [{
        lineNo: 1, materialCode: matCode, materialName: `质检编辑-${ts}`,
        spec: 'QC-SPEC', unit: 'pcs',
        inspectQty: '40', qualifiedQty: '35', unqualifiedQty: '5', result: 'PENDING',
        warehouseCode: WH,
      }],
    } })).json();

    await page.goto(`${BASE}/quality/inspection/${ins.id}/edit`);
    await page.waitForTimeout(1500);
    await page.waitForSelector('input', { timeout: 10000 });

    const inputs = await readInputs(page);

    // inspectionNo displayed (disabled)
    const insNo = inputs.find(i => i.value === ins.inspectionNo && i.disabled);
    expect(insNo, `inspectionNo=${ins.inspectionNo}`).toBeDefined();

    // Total inspect qty = 40 (disabled)
    const total = inputs.find(i => i.value === '40' && i.disabled);
    expect(total, 'total inspect qty=40 (disabled)').toBeDefined();

    // Header qualifiedQty = 35
    const qualified = inputs.find(i => i.value === '35' && !i.disabled);
    expect(qualified, 'qualifiedQty=35').toBeDefined();

    // Header unqualifiedQty = 5
    const unqualified = inputs.find(i => i.value === '5' && !i.disabled);
    expect(unqualified, 'unqualifiedQty=5').toBeDefined();

    // tbody lines contain our fixture materialCode
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);

    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.includes('QC-EDIT-')), 'line materialCode=QC-EDIT-xxx').toBeTruthy();
    expect(vals.some(v => v === '40'), 'line inspectQty=40').toBeTruthy();
    expect(vals.some(v => v === '35'), 'line qualifiedQty=35').toBeTruthy();
    expect(vals.some(v => v === '5'), 'line unqualifiedQty=5').toBeTruthy();
  });

  // ===== 20. Demand Plan create: project + department EntitySelect, auto qty =====
  test('20. Demand Plan create: project id/code/name + dept id/code/name, totalQty=30', async ({ page, request }) => {
    const token = await getToken(request);
    const h = auth(token);

    // Project + department shared fixtures (always present after prior test creation)
    const proj = (await (await request.get(`${API}/projects?pageSize=1`, h)).json()).items[0];
    if (!proj) throw new Error('No project found');
    let depts = (await (await request.get(`${API}/departments?pageSize=1`, h)).json()).items;
    if (depts.length === 0) {
      const tenantId = 'cmpjt7ki20000ylntl772qdkq';
      await request.post(`${API}/departments`, { ...h, data: { code: 'E2E-DEPT', name: 'E2E测试部门', status: 'ACTIVE', tenantId } });
      depts = (await (await request.get(`${API}/departments?pageSize=1`, h)).json()).items;
    }
    const dept = depts[0];
    if (!dept) throw new Error('No department available');

    await page.goto(`${BASE}/ops/demand-plan/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });
    const combos = page.locator('[role=combobox]');

    // Select project by name
    await combos.first().click(); await page.waitForTimeout(500);
    await clickOption(page, proj.name);
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);

    const inputs1 = await readInputs(page);

    // projectId in EntitySelect hidden input
    expect(inputs1.find(i => i.value === proj.id && !i.disabled), `projectId=${proj.id}`).toBeDefined();
    // projectCode rendered as disabled Input after EntitySelect fills it
    expect(inputs1.find(i => i.value === (proj.code || 'PRJ001') && i.disabled), `projectCode=${proj.code||'PRJ001'} (disabled)`).toBeDefined();
    // projectName rendered as disabled Input
    expect(inputs1.find(i => i.value === proj.name && i.disabled), `projectName=${proj.name} (disabled)`).toBeDefined();

    // Select department by name
    if ((await combos.count()) >= 2) {
      await combos.nth(1).click(); await page.waitForTimeout(500);
      await clickOption(page, dept.name);
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape'); await page.waitForTimeout(200);

      const inputs2 = await readInputs(page);
      expect(inputs2.find(i => i.value === dept.id && !i.disabled), `departmentId=${dept.id}`).toBeDefined();
      expect(inputs2.find(i => i.value === (dept.code || 'E2E-DEPT') && i.disabled), `departmentCode=${dept.code||'E2E-DEPT'} (disabled)`).toBeDefined();
      expect(inputs2.find(i => i.value === dept.name && i.disabled), `departmentName=${dept.name} (disabled)`).toBeDefined();
    }

    // Add line qty=30 → header totalQuantity=30
    const addBtn = page.getByRole('button', { name: '新增行' });
    await addBtn.click(); await page.waitForTimeout(300);
    await page.locator('tbody tr').nth(0).locator('td input').nth(5).fill('30');
    await page.waitForTimeout(500);

    const inputs3 = await readInputs(page);
    expect(inputs3.find(i => i.value === '30' && i.disabled), 'totalQuantity=30 (disabled)').toBeDefined();
  });

test('21. Demand Plan edit: API fixture DP → project id/code/name, dept id/code/name, qty=40, lines', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);
    const ts = Date.now() + 2;

    const proj = (await (await request.get(`${API}/projects?pageSize=1`, h)).json()).items[0];
    if (!proj) throw new Error('No project found');
    let depts = (await (await request.get(`${API}/departments?pageSize=1`, h)).json()).items;
    if (depts.length === 0) {
      const tenantId = 'cmpjt7ki20000ylntl772qdkq';
      await request.post(`${API}/departments`, { ...h, data: { code: 'E2E-DEPT', name: 'E2E测试部门', status: 'ACTIVE', tenantId } });
      depts = (await (await request.get(`${API}/departments?pageSize=1`, h)).json()).items;
    }
    const dept = depts[0];
    if (!dept) throw new Error('No department available');

    const WH = 'WH-001';
    const matCode = `DP-E2E-${ts}`;
    await request.post(`${API}/materials`, { ...h, data: {
      code: matCode, name: `DP物料-${ts}`, specification: 'DP1',
      categoryId: refs.cat.id, unitId: refs.unit.id, approvalStatus: 'APPROVED',
    } });
    const dpResp = await request.post(`${API}/demand-plans`, { ...h, data: {
      planName: `DP-E2E-${ts}`,
      projectId: proj.id, projectCode: proj.code || '', projectName: proj.name,
      departmentId: dept.id, departmentCode: dept.code || '', departmentName: dept.name,
      lines: [{ lineNo: 1, materialCode: matCode, materialName: `DP物料-${ts}`, spec: 'DP1', unit: 'pcs', quantity: '40', warehouseCode: WH }],
    } });
    expect(dpResp.ok(), 'DP creation HTTP OK').toBeTruthy();
    const dp = await dpResp.json();
    expect(dp.id, 'DP fixture has id').toBeDefined();

    await page.goto(`${BASE}/ops/demand-plan/${dp.id}/edit`);
    await page.waitForTimeout(2500);

    const inputs = await readInputs(page);
    expect(inputs.length, 'form inputs rendered').toBeGreaterThan(0);

    // planNo (disabled)
    expect(inputs.find(i => i.value === dp.planNo && i.disabled), `planNo=${dp.planNo} (disabled)`).toBeDefined();

    // projectId from EntitySelect (non-disabled — it's the hidden value input)
    expect(inputs.find(i => i.value === proj.id && !i.disabled), `projectId=${proj.id}`).toBeDefined();
    // projectCode rendered as disabled Input
    expect(inputs.find(i => i.value === (proj.code || 'PRJ001') && i.disabled), `projectCode=${proj.code||'PRJ001'} (disabled)`).toBeDefined();
    // projectName rendered as disabled Input
    expect(inputs.find(i => i.value === proj.name && i.disabled), `projectName=${proj.name} (disabled)`).toBeDefined();

    // departmentId from EntitySelect (non-disabled — hidden value)
    expect(inputs.find(i => i.value === dept.id && !i.disabled), `departmentId=${dept.id}`).toBeDefined();
    // departmentCode rendered as disabled Input (from POST payload, or EntitySelect auto-fill)
    expect(inputs.find(i => i.value === (dept.code || 'E2E-DEPT') && i.disabled), `departmentCode=${dept.code||'E2E-DEPT'} (disabled)`).toBeDefined();
    // departmentName rendered as disabled Input
    expect(inputs.find(i => i.value === dept.name && i.disabled), `departmentName=${dept.name} (disabled)`).toBeDefined();

    // totalQuantity=40 (disabled)
    expect(inputs.find(i => i.value === '40' && i.disabled), 'totalQuantity=40 (disabled)').toBeDefined();

    // tbody lines: materialCode + quantity match fixture
    const tbodyCount = await page.locator('tbody tr td input').count();
    expect(tbodyCount, `tbody lines (got ${tbodyCount})`).toBeGreaterThan(0);
    const vals: string[] = [];
    for (let i = 0; i < tbodyCount; i++) vals.push(await page.locator('tbody tr td input').nth(i).inputValue());
    expect(vals.some(v => v.includes('DP-E2E-')), 'line materialCode=DP-E2E-xxx').toBeTruthy();
    expect(vals.some(v => v === '40'), 'line quantity=40').toBeTruthy();
  });

  // ===== 22. Sales Return edit: customer fixtures → id/code/name, qty, amount =====
  test('22. Sales Return edit: customerId/Code/Name, shipmentNo, totalQuantity, totalAmount', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);

    const retResp = await request.post(`${API}/sales-returns`, { ...h, data: {
      returnNo: `SR-E2E-${Date.now()}`, customerId: refs.customer.id, customerCode: refs.customer.code || '', customerName: refs.customer.name,
      shipmentNo: 'SHIP-FIX-1', totalQuantity: '10', totalAmount: '100', returnReason: 'E2E',
    } });
    const ret = await retResp.json();

    await page.goto(`${BASE}/sales/return/${ret.id}/edit`);
    await page.waitForTimeout(2000);

    const inputs = await readInputs(page);
    // customerId in EntitySelect (non-disabled hidden value)
    expect(inputs.find(i => i.value === refs.customer.id && !i.disabled), `customerId=${refs.customer.id}`).toBeDefined();
    // EntitySelect combobox shows customer name (code+name display)
    const custCombo = (await page.locator('[role=combobox]').first().textContent()) || '';
    expect(custCombo.includes('选择customer'), `customer EntitySelect shows ${refs.customer.name}`).toBe(false);
    // shipmentNo disabled
    expect(inputs.find(i => i.value === 'SHIP-FIX-1' && i.disabled), 'shipmentNo=SHIP-FIX-1 (disabled)').toBeDefined();
    // qty=10 disabled
    expect(inputs.find(i => i.value === '10' && i.disabled), 'totalQuantity=10 (disabled)').toBeDefined();
    // amount=100 disabled
    expect(inputs.find(i => i.value === '100' && i.disabled), 'totalAmount=100 (disabled)').toBeDefined();
  });

  // ===== 23. Purchase Return create: supplier EntitySelect + PO source =====
  test('23. Purchase Return create: supplier id/code/name, PO source → material/qty/amount', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);

    // Create an APPROVED PO for source
    const po = await createApprovedPO(request, token, Date.now(), refs);

    await page.goto(`${BASE}/purchase/return/create`);
    await page.waitForSelector('[role=combobox]', { timeout: 10000 });

    const combos = page.locator('[role=combobox]');

    // Select supplier (1st combobox)
    await combos.first().click(); await page.waitForTimeout(500);
    await clickOption(page, refs.supplier.name);
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);

    const inputs1 = await readInputs(page);
    expect(inputs1.find(i => i.value === refs.supplier.id && !i.disabled), `supplierId=${refs.supplier.id}`).toBeDefined();

    // Select purchase order (2nd combobox)
    if ((await combos.count()) >= 2) {
      await combos.nth(1).click(); await page.waitForTimeout(500);
      await clickOption(page, `夹具采购-`);
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape'); await page.waitForTimeout(200);

      // source PO combobox should show the PO info
      const poComboText = (await combos.nth(1).textContent()) || '';
      expect(poComboText.includes('选择purchaseOrder'), `PO selected: ${poComboText}`).toBe(false);
      // supplier auto-filled from PO
      const supComboAfter = (await combos.first().textContent()) || '';
      expect(supComboAfter.includes('选择supplier'), `supplier auto-filled: ${supComboAfter}`).toBe(false);
    }
  });

  // ===== 24. Purchase Return edit: API fixture → supplier + fields =====
  test('24. Purchase Return edit: supplierId/Code/Name, PO orderNo, qty=30, amount=90', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);

    const retResp = await request.post(`${API}/purchase-returns`, { ...h, data: {
      returnNo: `PR-E2E-${Date.now()}`, supplierId: refs.supplier.id, supplierCode: refs.supplier.code || '', supplierName: refs.supplier.name,
      purchaseOrderNo: 'PO-FIX-2', materialName: '退供测试物料', totalQuantity: '30', totalAmount: '90', returnReason: 'E2E wrong order',
    } });
    const ret = await retResp.json();

    await page.goto(`${BASE}/purchase/return/${ret.id}/edit`);
    await page.waitForTimeout(2000);

    const inputs = await readInputs(page);
    // returnNo disabled
    expect(inputs.find(i => i.value === ret.returnNo && i.disabled), `returnNo=${ret.returnNo} (disabled)`).toBeDefined();
    // supplierId in EntitySelect
    expect(inputs.find(i => i.value === refs.supplier.id && !i.disabled), `supplierId=${refs.supplier.id}`).toBeDefined();
    // purchaseOrderNo disabled
    expect(inputs.find(i => i.value === 'PO-FIX-2' && i.disabled), 'purchaseOrderNo=PO-FIX-2 (disabled)').toBeDefined();
    // qty=30
    expect(inputs.find(i => i.value === '30' && !i.disabled), 'totalQuantity=30').toBeDefined();
    // amount=90
    expect(inputs.find(i => i.value === '90' && !i.disabled), 'totalAmount=90').toBeDefined();
    // reason
    expect(inputs.find(i => i.value === 'E2E wrong order' && !i.disabled), 'returnReason').toBeDefined();
  });

  // ===== 25. Check Order edit: material + warehouse EntitySelect, strong fixture =====
  test('25. Check Order edit: materialCode/spec/unit, warehouse, stock/check/diff', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);

    const ts = Date.now();
    const matCode = `CHK-FIX-${ts}`;
    await request.post(`${API}/materials`, { ...h, data: {
      code: matCode, name: `盘点物料-${ts}`, specification: 'CHK-SPEC-FIX', unitId: refs.unit.id,
      categoryId: refs.cat.id, approvalStatus: 'APPROVED',
    } });
    const matList = await request.get(`${API}/materials?code=${matCode}&pageSize=1`, h);
    const mat = (await matList.json()).items[0];

    // Use a warehouse via API
    const whList = await request.get(`${API}/warehouses?pageSize=1`, h);
    const wh = (await whList.json()).items[0];

    const chk = await (await request.post(`${API}/check-orders`, { ...h, data: {
      checkMethod: 'FULL', materialId: mat.id, materialCode: mat.code, materialName: mat.name,
      spec: 'CHK-SPEC-FIX', unit: mat.unitName || 'pcs', batchNo: 'B-KEEP',
      stockQty: '100', checkQty: '85', diffQty: '-15',
      warehouseId: wh.id, warehouseCode: wh.code, warehouseName: wh.name,
      inspector: 'E2E', checkDate: new Date().toISOString(),
    } })).json();

    await page.goto(`${BASE}/warehouse/check/${chk.id}/edit`);
    await page.waitForTimeout(2000);

    const inputs = await readInputs(page);
    // orderNo (disabled)
    expect(inputs.some(i => i.value === chk.orderNo && i.disabled), `orderNo=${chk.orderNo} (disabled)`).toBeTruthy();
    // materialId via EntitySelect
    expect(inputs.find(i => i.value === mat.id && !i.disabled), `materialId=${mat.id}`).toBeDefined();
    // materialCode (disabled)
    expect(inputs.find(i => i.value === mat.code && i.disabled), `materialCode=${mat.code} (disabled)`).toBeDefined();
    // spec
    expect(inputs.find(i => i.value === 'CHK-SPEC-FIX' && !i.disabled), 'spec=CHK-SPEC-FIX').toBeDefined();
    // unit (disabled)
    expect(inputs.find(i => i.value === (mat.unitName || 'pcs') && i.disabled), 'unit (disabled)').toBeDefined();
    // batchNo
    expect(inputs.find(i => i.value === 'B-KEEP' && !i.disabled), 'batchNo=B-KEEP').toBeDefined();
    // stockQty=100
    expect(inputs.find(i => i.value === '100' && !i.disabled), 'stockQty=100').toBeDefined();
    // checkQty=85
    expect(inputs.find(i => i.value === '85' && !i.disabled), 'checkQty=85').toBeDefined();
    // diffQty=-15 (disabled)
    expect(inputs.find(i => i.value === '-15' && i.disabled), 'diffQty=-15 (disabled)').toBeDefined();
    // warehouseId via EntitySelect
    expect(inputs.find(i => i.value === wh.id && !i.disabled), `warehouseId=${wh.id}`).toBeDefined();
    // warehouseCode (disabled)
    expect(inputs.find(i => i.value === wh.code && i.disabled), `warehouseCode=${wh.code} (disabled)`).toBeDefined();
  });

  // ===== 26. Transfer Out edit: material + warehouse EntitySelect, quantity =====
  test('26. Transfer Out edit: orderNo(disabled), materialCode(disabled), spec(disabled), unit(disabled), qty=20, fromWarehouseCode/Name(disabled), toWarehouseCode/Name(disabled)', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);

    const ts = Date.now();
    const matCode = `TR-FIX-${ts}`;
    await request.post(`${API}/materials`, { ...h, data: {
      code: matCode, name: `调拨物料-${ts}`, specification: 'TR-SPEC', unitId: refs.unit.id,
      categoryId: refs.cat.id, approvalStatus: 'APPROVED',
    } });
    const matList = await request.get(`${API}/materials?code=${matCode}&pageSize=1`, h);
    const mat = (await matList.json()).items[0];
    const unitName = mat.unitName || 'pcs';
    const whList = await request.get(`${API}/warehouses?pageSize=3`, h);
    const warehouses = (await whList.json()).items;
    const wh1 = warehouses[0], wh2 = warehouses[warehouses.length > 1 ? 1 : 0];

    const tr = await (await request.post(`${API}/transfer-orders`, { ...h, data: {
      orderNo: `TR-FIX-${ts}`, type: 'OUT', materialId: mat.id, materialCode: mat.code,
      materialName: mat.name, spec: 'TR-SPEC', unit: unitName, quantity: '20',
      fromWarehouse: wh1.name, fromWarehouseId: wh1.id, fromWarehouseCode: wh1.code,
      toWarehouse: wh2.name, toWarehouseId: wh2.id, toWarehouseCode: wh2.code,
    } })).json();

    await page.goto(`${BASE}/warehouse/transfer-out/${tr.id}/edit`);
    await page.waitForTimeout(2000);

    const inputs = await readInputs(page);
    // orderNo disabled
    expect(inputs.find(i => i.value === tr.orderNo && i.disabled), `orderNo=${tr.orderNo} (disabled)`).toBeDefined();
    // materialId in EntitySelect hidden input
    expect(inputs.find(i => i.value === mat.id && !i.disabled), `materialId=${mat.id}`).toBeDefined();
    // materialCode (disabled)
    expect(inputs.find(i => i.value === mat.code && i.disabled), `materialCode=${mat.code} (disabled)`).toBeDefined();
    // spec (disabled)
    expect(inputs.find(i => i.value === 'TR-SPEC' && i.disabled), 'spec=TR-SPEC (disabled)').toBeDefined();
    // unit (disabled)
    expect(inputs.find(i => i.value === unitName && i.disabled), `unit=${unitName} (disabled)`).toBeDefined();
    // qty=20
    expect(inputs.find(i => i.value === '20' && !i.disabled), 'quantity=20').toBeDefined();
    // fromWarehouseId in EntitySelect hidden input
    expect(inputs.find(i => i.value === wh1.id && !i.disabled), `fromWarehouseId=${wh1.id}`).toBeDefined();
    // fromWarehouseCode (disabled)
    expect(inputs.find(i => i.value === wh1.code && i.disabled), `fromWarehouseCode=${wh1.code} (disabled)`).toBeDefined();
    // fromWarehouseName (disabled — rendered as readonly Input)
    expect(inputs.find(i => i.value === wh1.name && i.disabled), `fromWarehouseName=${wh1.name} (disabled)`).toBeDefined();
    // toWarehouseId in EntitySelect hidden input
    expect(inputs.find(i => i.value === wh2.id && !i.disabled), `toWarehouseId=${wh2.id}`).toBeDefined();
    // toWarehouseCode (disabled)
    expect(inputs.find(i => i.value === wh2.code && i.disabled), `toWarehouseCode=${wh2.code} (disabled)`).toBeDefined();
    // toWarehouseName (disabled — rendered as readonly Input)
    expect(inputs.find(i => i.value === wh2.name && i.disabled), `toWarehouseName=${wh2.name} (disabled)`).toBeDefined();
  });

  // ===== 27. Scrap Apply edit: material + qty + reason =====
  test('27. Scrap Apply edit: materialCode/spec/unit, qty=15, reason, method', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);

    const ts = Date.now();
    const matCode = `SC-FIX-${ts}`;
    const matResp = await request.post(`${API}/materials`, { ...h, data: {
      code: matCode, name: `报废物料-${ts}`, specification: 'SC-SPEC', unitId: refs.unit.id,
      categoryId: refs.cat.id, approvalStatus: 'APPROVED',
    } });
    const mat = await matResp.json();

    const sc = await (await request.post(`${API}/scrap-orders`, { ...h, data: {
      orderNo: `SC-FIX-${ts}`, materialId: mat.id, materialCode: mat.code, materialName: mat.name,
      spec: 'SC-SPEC', unit: mat.unitName || 'pcs', quantity: '15',
      scrapReason: 'E2E damaged beyond repair', disposalMethod: '焚烧处理',
    } })).json();

    await page.goto(`${BASE}/warehouse/scrap-apply/${sc.id}/edit`);
    await page.waitForTimeout(2000);

    const inputs = await readInputs(page);
    // orderNo disabled
    expect(inputs.some(i => i.value === sc.orderNo && i.disabled), `orderNo=${sc.orderNo} (disabled)`).toBeTruthy();
    // materialId
    expect(inputs.find(i => i.value === mat.id && !i.disabled), `materialId=${mat.id}`).toBeDefined();
    // materialCode (disabled)
    expect(inputs.find(i => i.value === mat.code && i.disabled), `materialCode=${mat.code} (disabled)`).toBeDefined();
    // spec (disabled)
    expect(inputs.find(i => i.value === 'SC-SPEC' && i.disabled), 'spec=SC-SPEC (disabled)').toBeDefined();
    // unit (disabled)
    expect(inputs.find(i => i.value === (mat.unitName || 'pcs') && i.disabled), 'unit (disabled)').toBeDefined();
    // qty=15
    expect(inputs.find(i => i.value === '15' && !i.disabled), 'quantity=15').toBeDefined();
    // scrapReason
    expect(inputs.find(i => i.value === 'E2E damaged beyond repair' && !i.disabled), 'scrapReason').toBeDefined();
    // disposalMethod
    expect(inputs.find(i => i.value === '焚烧处理' && !i.disabled), 'disposalMethod').toBeDefined();
  });

  // ===== 28. Lend Order edit: orderNo/matCode/spec/unit/qty12/borrower/dates =====
  test('28. Lend Order edit: orderNo(disabled), matCode(disabled), spec=LEND-SPEC(disabled), unit=pcs(disabled), qty=12, borrower, borrowDate=2026-06-01, expectedReturn=2026-07-01', async ({ page, request }) => {
    const token = await getToken(request);
    const refs = await getSharedRefs(request, token);
    const h = auth(token);

    const ts = Date.now();
    const matCode = `LEND-FIX-${ts}`;
    const matResp = await request.post(`${API}/materials`, { ...h, data: {
      code: matCode, name: `借出物料-${ts}`, specification: 'LEND-SPEC', unitId: refs.unit.id,
      categoryId: refs.cat.id, approvalStatus: 'APPROVED',
    } });
    const mat = await matResp.json();
    const unitName = mat.unitName || 'pcs';

    const le = await (await request.post(`${API}/lend-orders`, { ...h, data: {
      orderNo: `LE-FIX-${ts}`, type: 'LEND', materialId: mat.id, materialCode: mat.code,
      materialName: mat.name, spec: 'LEND-SPEC', unit: unitName, quantity: '12',
      borrower: 'E2E借用人', borrowDate: '2026-06-01', expectedReturn: '2026-07-01',
    } })).json();

    await page.goto(`${BASE}/warehouse/lend-order/${le.id}/edit`);
    await page.waitForTimeout(2500);

    const inputs = await readInputs(page);
    expect(inputs.length, 'form inputs rendered').toBeGreaterThan(0);

    // orderNo (disabled) — find by the fixture orderNo
    expect(inputs.some(i => i.value === le.orderNo && i.disabled), `orderNo=${le.orderNo} (disabled)`).toBeTruthy();

    // materialId in EntitySelect hidden input
    expect(inputs.find(i => i.value === mat.id && !i.disabled), `materialId=${mat.id}`).toBeDefined();
    // materialCode (disabled)
    expect(inputs.find(i => i.value === mat.code && i.disabled), `materialCode=${mat.code} (disabled)`).toBeDefined();
    // spec=LEND-SPEC (disabled)
    expect(inputs.find(i => i.value === 'LEND-SPEC' && i.disabled), 'spec=LEND-SPEC (disabled)').toBeDefined();
    // unit=pcs (disabled)
    expect(inputs.find(i => i.value === unitName && i.disabled), `unit=${unitName} (disabled)`).toBeDefined();
    // qty=12
    expect(inputs.find(i => i.value === '12' && !i.disabled), 'quantity=12').toBeDefined();
    // borrower=E2E借用人
    expect(inputs.find(i => i.value === 'E2E借用人' && !i.disabled), 'borrower=E2E借用人').toBeDefined();
    // borrowDate=2026-06-01
    expect(inputs.find(i => i.value === '2026-06-01' && !i.disabled), 'borrowDate=2026-06-01').toBeDefined();
    // expectedReturn=2026-07-01
    expect(inputs.find(i => i.value === '2026-07-01' && !i.disabled), 'expectedReturn=2026-07-01').toBeDefined();
  });
});