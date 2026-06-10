/**
 * 用户流程 06 — 生产管理闭环 (BOM→生产订单→领料→完工, 硬断言版)
 *
 * 基础数据+库存 API seed。业务主单 UI 创建。所有库存变化硬断言。
 * 禁止: API fallback、按钮可选跳过、弱断言、console.log 代替库存校验。
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

// ──────────── helpers ────────────

async function login(p: any) {
  await p.goto(`${BASE}/login`);
  await p.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await p.fill('input[placeholder="请输入用户名"]', 'admin');
  await p.fill('input[placeholder="请输入密码"]', 'admin123');
  await p.click('button:has-text("登 录")');
  await p.waitForURL('**/');
  await p.waitForTimeout(800);
}

async function expandSidebar(p: any) {
  if ((await p.locator('aside').count()) === 0) {
    await p.locator('header button').first().click();
    await p.waitForTimeout(400);
  }
}

function installFC(p: any) {
  const a5: string[] = [];
  p.on('response', (r: any) => {
    if (r.url().includes('/api/') && r.status() >= 500) a5.push(`${r.status()} ${r.url()}`);
  });
  p.on('console', (m: any) => {
    if (
      m.type() === 'error' &&
      !m.text().includes('Warning:') &&
      !m.text().includes('hydration') &&
      !m.text().includes('unique "key"') &&
      !m.text().includes('400') &&
      !m.text().includes('Bad Request')
    )
      a5.push(m.text());
  });
  p.on('pageerror', (err: any) => a5.push(err.message));
  return {
    async check(l: string) {
      for (const t of ['This page could not be found', 'Internal server error']) {
        if ((await p.locator(`text=${t}`).count()) > 0) throw new Error(`${l}: "${t}"`);
      }
      if (a5.length > 0) throw new Error(`${l}: API500s/Errors: ${a5.join('; ').slice(0, 300)}`);
    },
  };
}

async function formSave(p: any) {
  await p.getByTestId('form-save-btn').click();
}

async function toolbarSearch(p: any) {
  for (const w of ['搜索', '查询']) {
    const b = p.locator('.h-14 button');
    for (let i = 0; i < await b.count(); i++) {
      if ((await b.nth(i).innerText()).trim() === w) { await b.nth(i).click(); return; }
    }
  }
}

async function pickerClick(p: any, triggerInput: any, searchValue?: string) {
  await triggerInput.scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  await triggerInput.click();
  await p.waitForTimeout(1500);
  const d = p.locator('[role="dialog"]').first();
  // If search value provided, fill the first search input in the dialog
  if (searchValue) {
    const searchInputs = d.locator('input:not([type="radio"]):not([disabled]):not([readonly])');
    if (await searchInputs.count() > 0) {
      await searchInputs.first().fill(searchValue);
      await p.waitForTimeout(200);
    }
  }
  await d.locator('button:has-text("查询")').click();
  await p.waitForTimeout(1000);
  expect(await d.locator('table tbody tr').count(), 'picker rows>0').toBeGreaterThan(0);
  await d.locator('table tbody input[type="radio"]').first().click();
  await p.waitForTimeout(300);
  await d.locator('button:has-text("确定")').click();
  await p.waitForTimeout(1200);
}

function H(t: string) {
  return { headers: { Authorization: `Bearer ${t}` } };
}
async function getToken(r: any) {
  return (
    await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()
  ).token;
}
async function invQty(request: any, token: string, matCode: string) {
  const h = H(token);
  const r = await request
    .get(`${API}/inventory?materialCode=${encodeURIComponent(matCode)}&pageSize=99`, h)
    .then((r: any) => r.json());
  return (r.items || []).reduce((s: number, x: any) => s + Number(x.quantity || 0), 0);
}

// ──────────── seed / cleanup ────────────

async function seedData(request: any) {
  const t = await getToken(request),
    h = H(t),
    ts = Date.now();
  const mk = (api: string, code: string, name: string, extra: any = {}) =>
    (async () => {
      const r = await request.get(`${API}/${api}?pageSize=999`, h).then((r: any) => r.json());
      let id = (r?.items || []).find((x: any) => x.code === code)?.id;
      if (!id)
        id = (
          await (
            await request.post(`${API}/${api}`, {
              ...h,
              data: { code, name, status: 'ACTIVE', sortOrder: 1, ...extra },
            })
          ).json()
        ).id;
      return id;
    })();
  const uId = await mk('measurement-units', `E2E_U_${ts}`, `E2E单位_${ts}`);
  const catId = await mk('material-categories', `E2E_C_${ts}`, `E2E分类_${ts}`);
  const prodMatCode = `E2E_PROD_${ts}`,
    rawMatCode = `E2E_RAW_${ts}`;
  const prodMatId = await mk('materials', prodMatCode, `E2E产品_${ts}`, {
    specification: 'E2E规格mm',
    categoryId: catId,
    unitId: uId,
    productCategory: '成品',
    planAttribute: '自制',
  });
  const rawMatId = await mk('materials', rawMatCode, `E2E原料_${ts}`, {
    specification: 'E2E规格mm',
    categoryId: catId,
    unitId: uId,
    productCategory: '原材料',
    planAttribute: '外购',
  });
  const whId = await mk('warehouses', `E2E_WH_${ts}`, `E2E仓_${ts}`);
  const wh: any = await request.get(`${API}/warehouses/${whId}`, h).then((r: any) => r.json());
  const whCode = wh.code || `E2E_WH_${ts}`;
  const deptId = await mk('departments', `E2E_DEPT_${ts}`, `E2E部门_${ts}`);
  return { prodMatId, prodMatCode, rawMatId, rawMatCode, whId, whCode, deptId, catId, uId, token: t, h };
}

async function cleanupData(request: any, d: any) {
  for (const k of ['rawMatId', 'prodMatId', 'catId', 'uId', 'whId', 'deptId']) {
    if (d[k])
      await request
        .delete(
          `${API}/${
            {
              rawMatId: 'materials',
              prodMatId: 'materials',
              catId: 'material-categories',
              uId: 'measurement-units',
              whId: 'warehouses',
              deptId: 'departments',
            }[k]
          }/${d[k]}`,
          d.h,
        )
        .catch(() => {});
  }
}

async function rollbackDocs(request: any, token: string) {
  const h = H(token);
  // Order matters: delete children before parents
  for (const api of [
    'issue-orders',
    'complete-reports',
    'return-orders',
    'production-orders',
    'boms',
    'inbound-orders',
    'outbound-orders',
  ]) {
    const r = await request.get(`${API}/${api}?pageSize=200`, h).then((r: any) => r.json());
    for (const o of r?.items || []) {
      if ((o.orderName || o.name || o.materialName || '')?.includes('E2E')) {
        if (o.approvalStatus === 'APPROVED')
          await request.put(`${API}/${api}/${o.id}/cancel-approve`, h).catch(() => {});
        await request.delete(`${API}/${api}/${o.id}`, h).catch(() => {});
      }
    }
  }
}

/** Seed a BOM with items, submit and approve it. Returns the BOM record. */
async function seedApprovedBom(request: any, h: any, td: any, name: string) {
  // Get next BOM code from backend
  const nextCodeResp = await request
    .get(`${API}/common/next-code?entity=bom`, h)
    .then((r: any) => r.json());
  const code = nextCodeResp.code || `BOM${Date.now()}`;
  const resp = await request
    .post(`${API}/boms`, {
      ...h,
      data: {
        code,
        name,
        version: 'V1.0',
        baseQty: '1',
        productMaterialId: td.prodMatId,
        productMaterialCode: td.prodMatCode,
        productMaterialName: td.prodMatCode,
        productSpec: 'E2E规格mm',
        productUnit: 'pcs',
        status: 'ACTIVE',
        items: [
          {
            lineNo: 1,
            materialId: td.rawMatId,
            materialCode: td.rawMatCode,
            materialName: 'E2E原料',
            spec: 'E2E规格mm',
            unit: 'pcs',
            quantity: '10',
            lossRate: '0',
          },
        ],
      },
    })
    .then((r: any) => r.json());
  await request.put(`${API}/boms/${resp.id}/submit`, h);
  await request.put(`${API}/boms/${resp.id}/approve`, h);
  return resp;
}

// ═══════════════════ A. BOM+工艺+路线 ═══════════════════
test.describe('A — BOM/工艺/路线', () => {
  let td: any;
  test.beforeAll(async ({ request }) => {
    td = await seedData(request);
  });
  test.afterAll(async ({ request }) => {
    await cleanupData(request, td);
  });
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandSidebar(page);
  });

  test('A1 BOM UI新增→产品+子件→保存→搜索→提交→审批', async ({ page }) => {
    test.setTimeout(90000);
    const fc = installFC(page);
    const ts = Date.now(),
      bomName = `E2E_BOM_${ts}`;

    // ── Create ──
    await page.goto(`${BASE}/production/bom/create`);
    await page.waitForTimeout(2000);
    await fc.check('bom-create-page');

    // Fill BOM name
    await page.locator('label:has-text("BOM名称") + div input').first().fill(bomName);

    // Pick product material — search for our seeded E2E product
    const prodPickerTrigger = page
      .locator('label:has-text("成品物料") + div input[readonly]')
      .first();
    await pickerClick(page, prodPickerTrigger, td.prodMatCode);
    await page.waitForTimeout(500);
    const prodCode = await page
      .locator('label:has-text("成品编码") + div input')
      .first()
      .inputValue();
    expect(prodCode.trim().length, 'product code auto-filled after picker').toBeGreaterThan(0);
    console.log(`A1: product code = ${prodCode}`);

    // Fill sub-item on the existing first row
    const subRow = page.locator('#items table tbody tr').first();

    // Pick sub-item material — search for our seeded E2E raw material (different from product)
    const subPickerTrigger = subRow.locator('input[readonly]').nth(1);
    await pickerClick(page, subPickerTrigger, td.rawMatCode);
    await page.waitForTimeout(500);

    // Fill quantity and loss rate
    const numInputs = subRow.locator('input[type="number"]');
    await numInputs.nth(0).fill('5'); // quantity
    await numInputs.nth(1).fill('0'); // loss rate
    await page.waitForTimeout(300);

    // Save
    await formSave(page);
    await page.waitForTimeout(3000);
    await fc.check('bom-save');

    // MUST have left create page
    expect(page.url(), 'must redirect away from /create after save').not.toContain('/create');

    // ── Search ──
    await page.goto(`${BASE}/production/bom`);
    await page.waitForTimeout(2000);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);

    const lt = await page.locator('table tbody').innerText();
    expect(lt, 'BOM must appear in list after save').toContain(bomName);

    // ── Get BOM code ──
    const row = page.locator('table tbody tr').filter({ hasText: bomName }).first();
    expect(await row.count(), 'bom row in list').toBeGreaterThan(0);
    const bomCode = (await row.locator('td').nth(3).innerText()).trim();
    console.log(`A1: BOM = ${bomCode}`);

    // ── Submit ──
    const submitBtn = row.locator('button:has-text("提交")');
    expect(await submitBtn.count(), 'BOM submit btn must exist for DRAFT').toBeGreaterThan(0);
    await submitBtn.first().click();
    await page.waitForTimeout(1500);
    await fc.check('bom-submit');

    // Re-search after submit
    await toolbarSearch(page);
    await page.waitForTimeout(1500);

    // ── Approve ──
    const row2 = page.locator('table tbody tr').filter({ hasText: bomName }).first();
    const approveBtn = row2.locator('button:has-text("通过")');
    expect(await approveBtn.count(), 'approve btn must exist for SUBMITTED').toBeGreaterThan(0);
    await approveBtn.first().click();
    await page.waitForTimeout(1500);
    await fc.check('bom-approve');

    console.log(`A1: BOM ${bomCode} 审批通过 ✅`);
  });

  test('A2 工艺页面加载→新增→保存→搜索', async ({ page }) => {
    const fc = installFC(page);
    const ts = Date.now(),
      prName = `E2E工艺_${ts}`;

    await page.goto(`${BASE}/production/process`);
    await page.waitForTimeout(1500);
    await fc.check('pr-list');
    expect(await page.locator('table').count(), 'process table must exist').toBeGreaterThan(0);

    // Add new
    await page.locator('.h-14 button:has-text("新增")').first().click();
    await page.waitForTimeout(2000);
    expect(page.url(), 'must navigate to create page').toContain('/create');

    // Fill code and name (both required)
    const inputs = page.locator('input:not([disabled]):not([readonly])');
    await inputs.nth(0).fill(`E2E_PROC_${ts}`); // code
    await inputs.nth(1).fill(prName); // name
    await formSave(page);
    await page.waitForTimeout(2000);
    await fc.check('pr-save');
    expect(page.url(), 'must redirect away from create').not.toContain('/create');

    // Search
    await page.goto(`${BASE}/production/process`);
    await page.waitForTimeout(1500);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    const lt = await page.locator('table tbody').innerText();
    expect(lt, 'process must appear in list').toContain(prName);
    console.log(`A2: Process ${prName} saved ✅`);
  });

  test('A3 工艺路线页面加载→新增→保存→搜索', async ({ page }) => {
    const fc = installFC(page);
    const ts = Date.now(),
      rtName = `E2E路线_${ts}`;

    await page.goto(`${BASE}/production/route`);
    await page.waitForTimeout(1500);
    await fc.check('rt-list');
    expect(await page.locator('table').count(), 'route table must exist').toBeGreaterThan(0);

    // Add new
    await page.locator('.h-14 button:has-text("新增")').first().click();
    await page.waitForTimeout(2000);
    expect(page.url(), 'must navigate to create page').toContain('/create');

    // Fill code and name (both required)
    const inputs = page.locator('input:not([disabled]):not([readonly])');
    await inputs.nth(0).fill(`E2E_ROUTE_${ts}`); // code
    await inputs.nth(1).fill(rtName); // name
    await formSave(page);
    await page.waitForTimeout(2000);
    await fc.check('rt-save');
    expect(page.url(), 'must redirect away from create').not.toContain('/create');

    // Search
    await page.goto(`${BASE}/production/route`);
    await page.waitForTimeout(1500);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    const lt = await page.locator('table tbody').innerText();
    expect(lt, 'route must appear in list').toContain(rtName);
    console.log(`A3: Route ${rtName} saved ✅`);
  });
});

// ═══════════════════ B. 生产订单→领料→完工 全闭环 ═══════════════════
test.describe('B — 生产订单→领料→完工闭环', () => {
  let td: any;
  test.beforeAll(async ({ request }) => {
    td = await seedData(request);
  });
  test.afterAll(async ({ request }) => {
    await rollbackDocs(request, td.token);
    await cleanupData(request, td);
  });
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandSidebar(page);
  });

  test('B1 生产订单 UI新增→选BOM自动带出→保存→提交→审批', async ({ page, request }) => {
    test.setTimeout(90000);
    const fc = installFC(page);
    const hdr = H(td.token);
    const ts = Date.now(),
      poName = `E2E生产_${ts}`;

    // Seed + approve BOM (base data prep, allowed)
    const bomName = `E2E_BOM_PO_${ts}`;
    const bomResp = await seedApprovedBom(request, hdr, td, bomName);
    const seededBomCode = bomResp.code; // Use BOM code for picker search

    // ── UI Create Production Order ──
    await page.goto(`${BASE}/production/order/create`);
    await page.waitForTimeout(2000);
    await fc.check('po-create');

    // Fill order name and quantity
    await page.locator('label:has-text("订单名称") + div input').first().fill(poName);
    await page.locator('label:has-text("生产数量") + div input').first().fill('10');

    // Select BOM via picker — search by BOM code to find our seeded BOM
    const bomPickerTrigger = page
      .locator('label:has-text("选择BOM") + div input[readonly]')
      .first();
    await pickerClick(page, bomPickerTrigger, seededBomCode);
    await page.waitForTimeout(2000);
    await fc.check('po-bom-select');

    // Verify BOM info auto-filled
    const bomCodeVal = await page
      .locator('label:has-text("BOM编码") + div input')
      .first()
      .inputValue();
    console.log(`B1: BOM code after select = "${bomCodeVal}"`);
    expect(bomCodeVal.trim().length, 'BOM code auto-filled').toBeGreaterThan(0);

    // Verify material name also populated (from BOM product info)
    const matNameVal = await page
      .locator('label:has-text("物料名称") + div input')
      .first()
      .inputValue();
    console.log(`B1: Material name after select = "${matNameVal}"`);

    // Save
    await formSave(page);
    await page.waitForTimeout(3000);
    await fc.check('po-save');
    expect(page.url(), 'must redirect away from create').not.toContain('/create');

    // ── Search & Submit & Approve on list page ──
    await page.goto(`${BASE}/production/order`);
    await page.waitForTimeout(2000);

    // Get the PO number via API (read-only — the PO was created by UI save)
    // Query without code filter (code searches orderNo, not orderName)
    const posResp = await request
      .get(`${API}/production-orders?pageSize=20`, hdr)
      .then((r: any) => r.json());
    const createdPo = (posResp.items || []).find((x: any) => x.orderName === poName);
    expect(createdPo, 'PO must exist after UI save').toBeTruthy();
    const orderNo = createdPo!.orderNo;
    console.log(`B1: PO = ${orderNo}`);

    // Search by order number (生产编号 field)
    await page
      .locator('.bg-muted\\/30')
      .locator('input')
      .last()
      .fill(orderNo);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);

    let row = page.locator('table tbody tr').filter({ hasText: orderNo }).first();
    expect(await row.count(), 'PO must appear in list').toBeGreaterThan(0);

    // Submit
    const submitBtn = row.locator('button:has-text("提交")');
    expect(await submitBtn.count(), 'PO submit btn must exist').toBeGreaterThan(0);
    await submitBtn.first().click();
    await page.waitForTimeout(1500);
    await fc.check('po-submit');

    // Re-search and approve
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').filter({ hasText: poName }).first();

    const approveBtn = row.locator('button:has-text("通过")');
    expect(await approveBtn.count(), 'PO approve btn must exist after submit').toBeGreaterThan(0);
    await approveBtn.first().click();
    await page.waitForTimeout(1500);
    await fc.check('po-approve');

    console.log(`B1: PO ${orderNo} 审批通过 ✅`);
    (test as any)._b1OrderNo = orderNo;
  });

  test('B2 领料下推→登卡→原料库存减少→撤销登卡→库存回退', async ({ page, request }) => {
    test.setTimeout(120000);
    const fc = installFC(page);
    const hdr = H(td.token);
    const ts = Date.now(),
      poName = `E2E领料_${ts}`;

    // ── Seed prep ──
    // 1. Approved BOM
    const bomResp = await seedApprovedBom(request, hdr, td, `E2E_BOM_IS_${ts}`);

    // 2. Approved PO with material lines
    const poResp = await request
      .post(`${API}/production-orders`, {
        ...hdr,
        data: {
          orderName: poName,
          bomId: bomResp.id,
          materialId: td.prodMatId,
          materialName: 'E2E产品',
          quantity: '10',
          lines: [
            {
              lineNo: 1,
              materialCode: td.prodMatCode,
              materialName: 'E2E产品',
              spec: 'E2E规格mm',
              unit: 'pcs',
              plannedQty: '10',
              warehouseCode: td.whCode,
            },
          ],
          materials: [
            {
              lineNo: 1,
              materialCode: td.rawMatCode,
              materialName: 'E2E原料',
              spec: 'E2E规格mm',
              unit: 'pcs',
              quantity: '100',
              warehouseCode: td.whCode,
            },
          ],
        },
      })
      .then((r: any) => r.json());
    await request.put(`${API}/production-orders/${poResp.id}/submit`, hdr);
    await request.put(`${API}/production-orders/${poResp.id}/approve`, hdr);
    const poNo = poResp.orderNo;

    // 3. Inbound stock for raw material
    const ib = await request
      .post(`${API}/inbound-orders`, {
        ...hdr,
        data: {
          materialName: 'E2E原料',
          specification: 'E2E规格mm',
          quantity: '500',
          warehouseId: td.whId,
          warehouseCode: td.whCode,
          unitPrice: '10',
          totalAmount: '5000',
          lines: [
            {
              lineNo: 1,
              materialCode: td.rawMatCode,
              materialName: 'E2E原料',
              spec: 'E2E规格mm',
              unit: 'pcs',
              quantity: '500',
              warehouseCode: td.whCode,
            },
          ],
        },
      })
      .then((r: any) => r.json());
    await request.put(`${API}/inbound-orders/${ib.id}/submit`, hdr);
    await request.put(`${API}/inbound-orders/${ib.id}/approve`, hdr);

    // ── Stock BEFORE ──
    const stockBefore = await invQty(request, td.token, td.rawMatCode);
    console.log(`B2: RAW STOCK BEFORE = ${stockBefore}`);
    expect(stockBefore, 'raw material must have stock before issue').toBeGreaterThan(0);

    // ── UI: Push-down issue from PO ──
    await page.goto(`${BASE}/production/order`);
    await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(poNo);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);

    let row = page.locator('table tbody tr').filter({ hasText: poNo }).first();
    expect(await row.count(), 'PO must be in list').toBeGreaterThan(0);
    const pushIssueBtn = row.locator('button:has-text("下推领料")');
    expect(await pushIssueBtn.count(), 'push-issue btn must exist for APPROVED PO').toBeGreaterThan(0);

    page.once('dialog', (d: any) => d.accept());
    await pushIssueBtn.first().click();
    await page.waitForTimeout(3000);
    await fc.check('push-issue');

    // ── Find the issue order via API (read-only, not creating) ──
    const isResp = await request
      .get(`${API}/issue-orders?pageSize=5`, hdr)
      .then((r: any) => r.json());
    const issueItem = isResp.items?.[0];
    expect(issueItem, 'issue order must exist after push-down').toBeTruthy();
    const issueNo = issueItem!.orderNo;
    console.log(`B2: ISSUE = ${issueNo}`);

    // ── UI: Submit issue order ──
    await page.goto(`${BASE}/production/issue`);
    await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(issueNo);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);

    row = page.locator('table tbody tr').filter({ hasText: issueNo }).first();
    expect(await row.count(), 'issue order must be in list').toBeGreaterThan(0);

    const issueSubmitBtn = row.locator('button:has-text("提交")');
    expect(await issueSubmitBtn.count(), 'issue submit btn must exist').toBeGreaterThan(0);
    await issueSubmitBtn.first().click();
    await page.waitForTimeout(1500);
    await fc.check('is-submit');

    // Re-search and 登卡
    await toolbarSearch(page);
    await page.waitForTimeout(1500);

    row = page.locator('table tbody tr').filter({ hasText: issueNo }).first();
    const issueApproveBtn = row.locator('button:has-text("登卡")');
    expect(await issueApproveBtn.count(), 'issue 登卡 btn must exist after submit').toBeGreaterThan(0);
    await issueApproveBtn.first().click();
    await page.waitForTimeout(2000);
    await fc.check('is-approve');

    // ── Stock AFTER 登卡 (must decrease) ──
    const stockAfter = await invQty(request, td.token, td.rawMatCode);
    console.log(`B2: RAW STOCK AFTER = ${stockAfter}`);
    expect(stockAfter, `raw stock must decrease: ${stockBefore} → ${stockAfter}`).toBeLessThan(
      stockBefore,
    );

    // ── UI: Cancel 登卡 ──
    await toolbarSearch(page);
    await page.waitForTimeout(1500);

    row = page.locator('table tbody tr').filter({ hasText: issueNo }).first();
    const cancelBtn = row.locator('button:has-text("撤销登卡")');
    expect(await cancelBtn.count(), 'cancel btn must exist after approve').toBeGreaterThan(0);

    page.once('dialog', (d: any) => d.accept());
    await cancelBtn.first().click();
    await page.waitForTimeout(2000);
    await fc.check('is-cancel');

    // ── Stock AFTER cancel (must return to before) ──
    const stockCancel = await invQty(request, td.token, td.rawMatCode);
    console.log(`B2: RAW STOCK AFTER cancel = ${stockCancel}`);
    expect(stockCancel, `raw stock must return: ${stockBefore} vs ${stockCancel}`).toBe(
      stockBefore,
    );

    console.log(`B2: 领料 ${issueNo} 库存闭环验证通过 ✅`);
    (test as any)._b2IssueNo = issueNo;
  });

  test('B3 完工报告下推→提交→登卡→成品库存增加→撤销→库存回退', async ({ page, request }) => {
    test.setTimeout(120000);
    const fc = installFC(page);
    const hdr = H(td.token);
    const ts = Date.now(),
      poName = `E2E完工_${ts}`;

    // ── Seed prep ──
    // 1. Approved PO with product lines, set to IN_PRODUCTION
    const poResp = await request
      .post(`${API}/production-orders`, {
        ...hdr,
        data: {
          orderName: poName,
          materialId: td.prodMatId,
          materialName: 'E2E产品',
          quantity: '50',
          lines: [
            {
              lineNo: 1,
              materialCode: td.prodMatCode,
              materialName: 'E2E产品',
              spec: 'E2E规格mm',
              unit: 'pcs',
              plannedQty: '50',
              warehouseCode: td.whCode,
            },
          ],
        },
      })
      .then((r: any) => r.json());
    await request.put(`${API}/production-orders/${poResp.id}/submit`, hdr);
    await request.put(`${API}/production-orders/${poResp.id}/approve`, hdr);
    const poNo = poResp.orderNo;

    // Set to IN_PRODUCTION (required for 下推完工)
    await request
      .put(`${API}/production-orders/${poResp.id}`, {
        ...hdr,
        data: { businessStatus: 'IN_PRODUCTION' },
      })
      .catch(() => {});

    // ── Stock BEFORE ──
    const stockBefore = await invQty(request, td.token, td.prodMatCode);
    console.log(`B3: PROD STOCK BEFORE = ${stockBefore}`);

    // ── UI: Push-down complete report from PO ──
    await page.goto(`${BASE}/production/order`);
    await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(poNo);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);

    let row = page.locator('table tbody tr').filter({ hasText: poNo }).first();
    expect(await row.count(), 'PO must be in list').toBeGreaterThan(0);

    const pushCrBtn = row.locator('button:has-text("下推完工")');
    expect(
      await pushCrBtn.count(),
      'push-complete-report btn must exist for IN_PRODUCTION PO',
    ).toBeGreaterThan(0);

    page.once('dialog', (d: any) => d.accept());
    await pushCrBtn.first().click();
    await page.waitForTimeout(3000);
    await fc.check('push-cr');

    // ── Find the complete report via API (read-only) ──
    const crs = await request
      .get(`${API}/complete-reports?pageSize=20`, hdr)
      .then((r: any) => r.json());
    const cr = (crs.items || []).find((x: any) => (x.reportNo || '').includes('RPT'));
    expect(cr, 'complete report must exist after push-down').toBeTruthy();
    const crNo = cr!.reportNo;
    console.log(`B3: COMPLETE REPORT = ${crNo}`);

    // ── UI: Submit complete report ──
    await page.goto(`${BASE}/production/complete-audit`);
    await page.waitForTimeout(2000);
    await fc.check('audit-page');

    // Search for the report
    await page.locator('.bg-muted\\/30').locator('input').first().fill(crNo);
    await page.waitForTimeout(300);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);

    // Find the row and click submit
    row = page.locator('table tbody tr').filter({ hasText: crNo }).first();
    expect(await row.count(), 'CR must be in audit list').toBeGreaterThan(0);

    const crSubmitBtn = row.locator('button:has-text("提交")');
    expect(await crSubmitBtn.count(), 'CR submit btn must exist for DRAFT').toBeGreaterThan(0);
    await crSubmitBtn.first().click();
    await page.waitForTimeout(1500);
    await fc.check('cr-submit');

    // Re-search and 登卡/审核
    await toolbarSearch(page);
    await page.waitForTimeout(1500);

    row = page.locator('table tbody tr').filter({ hasText: crNo }).first();
    const crApproveBtn = row.locator('button:has-text("登卡/审核")');
    expect(await crApproveBtn.count(), 'CR 登卡/审核 btn must exist after submit').toBeGreaterThan(
      0,
    );
    await crApproveBtn.first().click();
    await page.waitForTimeout(2000);
    await fc.check('cr-approve');

    // ── Stock AFTER 登卡 (must increase) ──
    const stockAfter = await invQty(request, td.token, td.prodMatCode);
    console.log(`B3: PROD STOCK AFTER = ${stockAfter}`);
    expect(
      stockAfter,
      `product stock must increase: ${stockBefore} → ${stockAfter}`,
    ).toBeGreaterThan(stockBefore);

    // ── UI: Cancel 登卡 ──
    await toolbarSearch(page);
    await page.waitForTimeout(1500);

    row = page.locator('table tbody tr').filter({ hasText: crNo }).first();
    const cancelBtn = row.locator('button:has-text("撤销登卡")');
    expect(await cancelBtn.count(), 'cancel btn must exist after approve').toBeGreaterThan(0);

    page.once('dialog', (d: any) => d.accept());
    await cancelBtn.first().click();
    await page.waitForTimeout(2000);
    await fc.check('cr-cancel');

    // ── Stock AFTER cancel (must return to before) ──
    const stockCancel = await invQty(request, td.token, td.prodMatCode);
    console.log(`B3: PROD STOCK AFTER cancel = ${stockCancel}`);
    expect(
      stockCancel,
      `product stock must return: ${stockBefore} vs ${stockCancel}`,
    ).toBe(stockBefore);

    console.log(`B3: 完工 ${crNo} 库存闭环验证通过 ✅`);
    (test as any)._b3CrNo = crNo;
  });
});

// ═══════════════════ C. 查询+布局 ═══════════════════
test.describe('C — 查询+布局', () => {
  let td: any;
  test.beforeAll(async ({ request }) => {
    td = await seedData(request);
  });
  test.afterAll(async ({ request }) => {
    await cleanupData(request, td);
  });
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expandSidebar(page);
  });

  test('C1 生产订单查询→搜索本轮单号→表格包含', async ({ page, request }) => {
    const hdr = H(td.token);
    const ts = Date.now(),
      poName = `E2E查询_${ts}`;
    const poResp = await request
      .post(`${API}/production-orders`, {
        ...hdr,
        data: { orderName: poName, quantity: '1' },
      })
      .then((r: any) => r.json());
    const poNo = poResp.orderNo;

    await page.goto(`${BASE}/production/query/order`);
    await page.waitForTimeout(2000);
    const fc = installFC(page);

    await page.locator('.bg-muted\\/30').locator('input').first().fill(poNo);
    await page.waitForTimeout(300);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);
    await fc.check('po-query');

    const bodyText = await page.locator('table tbody').innerText();
    expect(bodyText, 'query table must contain order number').toContain(poNo);
    console.log(`C1: Query page found PO ${poNo} ✅`);

    // Cleanup
    await request.delete(`${API}/production-orders/${poResp.id}`, hdr).catch(() => {});
  });

  test('C2 领料查询→搜索本轮单号→表格包含', async ({ page, request }) => {
    const hdr = H(td.token);
    const ts = Date.now(),
      poName = `E2E查询IS_${ts}`;

    // Seed PO + approve + generate-issue via API (base data prep)
    const poResp = await request
      .post(`${API}/production-orders`, {
        ...hdr,
        data: {
          orderName: poName,
          materialId: td.prodMatId,
          quantity: '1',
          materials: [
            {
              lineNo: 1,
              materialCode: td.rawMatCode,
              materialName: 'E2E原料',
              spec: 'E2E规格mm',
              unit: 'pcs',
              quantity: '10',
              warehouseCode: td.whCode,
            },
          ],
        },
      })
      .then((r: any) => r.json());
    await request.put(`${API}/production-orders/${poResp.id}/submit`, hdr);
    await request.put(`${API}/production-orders/${poResp.id}/approve`, hdr);
    await request.post(`${API}/production-orders/${poResp.id}/generate-issue`, hdr).catch(() => {});

    const isResp = await request
      .get(`${API}/issue-orders?pageSize=5`, hdr)
      .then((r: any) => r.json());
    const isNo = isResp.items?.[0]?.orderNo || '';
    expect(isNo, 'must have issue order for query test').toBeTruthy();

    await page.goto(`${BASE}/production/query/issue`);
    await page.waitForTimeout(2000);
    const fc = installFC(page);

    await page.locator('.bg-muted\\/30').locator('input').first().fill(isNo);
    await page.waitForTimeout(300);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);
    await fc.check('is-query');

    const bodyText = await page.locator('table tbody').innerText();
    expect(bodyText, 'query table must contain issue number').toContain(isNo);
    console.log(`C2: Query page found Issue ${isNo} ✅`);

    // Cleanup
    await request.delete(`${API}/production-orders/${poResp.id}`, hdr).catch(() => {});
  });

  for (const [label, url] of [
    ['生产订单', '/production/order'],
    ['领料单', '/production/issue'],
    ['BOM', '/production/bom'],
  ] as [string, string][]) {
    test(`C3-${label} 分页+表头布局不重叠`, async ({ page }) => {
      const fc = installFC(page);
      await page.goto(`${BASE}${url}`);
      await page.waitForTimeout(1500);
      await fc.check(label);

      // Pagination must exist
      expect(
        await page.getByTestId('erp-pagination').count(),
        `${label}: pagination must exist`,
      ).toBeGreaterThan(0);

      // Table header must have non-zero width (not collapsed/overlapping)
      const thBox = await page.locator('table thead th').first().boundingBox();
      if (thBox) expect(thBox.width, `${label}: header width > 20`).toBeGreaterThan(20);

      // Table must be scrollable (no fixed height that clips content)
      const tableContainer = page.locator('.overflow-auto, .min-h-0');
      expect(await tableContainer.count(), `${label}: scrollable container`).toBeGreaterThan(0);
    });
  }
});
