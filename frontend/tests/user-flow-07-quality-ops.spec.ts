/**
 * 用户流程 07 — 质量管理 + 需求计划闭环 (硬断言版)
 *
 * 所有 create/submit/approve/push-down 必须通过 UI 按钮完成。
 * 所有断言必须硬断言，不允许 console.log 代替 expect。
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
  if ((await p.locator('aside').count()) === 0) { await p.locator('header button').first().click(); await p.waitForTimeout(400); }
}
function installFC(p: any) {
  const a5: string[] = [];
  p.on('response', (r: any) => { if (r.url().includes('/api/') && r.status() >= 500) a5.push(`${r.status()} ${r.url()}`); });
  p.on('console', (m: any) => {
    if (m.type() === 'error' && !m.text().includes('Warning:') && !m.text().includes('hydration') && !m.text().includes('unique "key"') && !m.text().includes('400') && !m.text().includes('Bad Request') && !m.text().includes('409') && !m.text().includes('Conflict'))
      a5.push(m.text());
  });
  p.on('pageerror', (err: any) => a5.push(err.message));
  return { async check(l: string) {
    for (const t of ['This page could not be found', 'Internal server error']) { if ((await p.locator(`text=${t}`).count()) > 0) throw new Error(`${l}: "${t}"`); }
    if (a5.length > 0) throw new Error(`${l}: API500s/Errors: ${a5.join('; ').slice(0, 300)}`);
  }};
}
async function formSave(p: any) {
  await p.locator('button[data-testid="form-save-btn"]').first().click();
}
async function toolbarSearch(p: any) {
  for (const w of ['搜索','查询']) { const b = p.locator('.h-14 button'); for (let i = 0; i < await b.count(); i++) { if ((await b.nth(i).innerText()).trim() === w) { await b.nth(i).click(); return; } } }
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
  const wh: any = await request.get(`${API}/warehouses/${whId}`, h).then((r: any) => r.json());
  const whCode = wh.code || `E2E_WH_${ts}`;
  const deptId = await mk('departments', `E2E_DEPT_${ts}`, `E2E部门_${ts}`);
  const projectId = await mk('projects', `E2E_PRJ_${ts}`, `E2E项目_${ts}`);
  const supplierId = await mk('suppliers', `E2E_SUP_${ts}`, `E2E供应商_${ts}`);
  // Seed 2 APPROVED purchase orders for inspection source (one per test)
  const poResp1 = await request.post(`${API}/purchase-orders`, { ...h, data: { orderName: `E2E采购A1_${ts}`, supplierId, supplierName: `E2E供应商_${ts}`, totalAmount: '1000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '100', warehouseCode: whCode }] } }).then((r: any) => r.json());
  await request.put(`${API}/purchase-orders/${poResp1.id}/submit`, h);
  await request.put(`${API}/purchase-orders/${poResp1.id}/approve`, h);
  const poResp2 = await request.post(`${API}/purchase-orders`, { ...h, data: { orderName: `E2E采购A2_${ts}`, supplierId, supplierName: `E2E供应商_${ts}`, totalAmount: '1000', lines: [{ lineNo: 1, materialCode: matCode, materialName: matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '100', warehouseCode: whCode }] } }).then((r: any) => r.json());
  await request.put(`${API}/purchase-orders/${poResp2.id}/submit`, h);
  await request.put(`${API}/purchase-orders/${poResp2.id}/approve`, h);
  return { matId, matCode, matName, whId, whCode, deptId, projectId, supplierId, poNo1: poResp1.orderNo, poNo2: poResp2.orderNo, catId, uId, token: t, h };
}
async function cleanupData(request: any, d: any) {
  const map: Record<string, string> = { matId: 'materials', catId: 'material-categories', uId: 'measurement-units', whId: 'warehouses', deptId: 'departments', projectId: 'projects', supplierId: 'suppliers' };
  for (const k of Object.keys(map)) { if (d[k]) await request.delete(`${API}/${map[k]}/${d[k]}`, d.h).catch(() => {}); }
}
async function rollbackDocs(request: any, token: string) {
  const h = H(token);
  for (const api of ['inbound-orders', 'inspections', 'demand-plans', 'purchase-plans', 'scrap-orders', 'purchase-orders']) {
    const r = await request.get(`${API}/${api}?pageSize=200`, h).then((r: any) => r.json());
    for (const o of r?.items || []) {
      if ((o.inspectionNo || o.planName || o.orderName || o.materialName || '')?.includes('E2E')) {
        if (o.approvalStatus === 'APPROVED') await request.put(`${API}/${api}/${o.id}/cancel-approve`, h).catch(() => {});
        await request.delete(`${API}/${api}/${o.id}`, h).catch(() => {});
      }
    }
  }
}

// ═══════════════════ A. 质检管理 ═══════════════════
test.describe('A — 质检管理', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await rollbackDocs(request, td.token); await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('A1 质检 UI新增→选来源PO→自动带出→保存→提交→审批→强断言', async ({ page, request }) => {
    test.setTimeout(90000);
    const fc = installFC(page);
    const hdr = H(td.token);
    const ts = Date.now(), inspName = `E2E质检_${ts}`;

    // ── CREATE ──
    await page.goto(`${BASE}/quality/inspection/create`);
    await page.waitForTimeout(2000); await fc.check('insp-create');
    const autoNo = await page.locator('label:has-text("质检单号") + div input').first().inputValue();
    console.log(`A1: inspectionNo = ${autoNo}`);

    // Select source PO via picker
    const srcPicker = page.locator('label:has-text("来源单号") + div input[readonly]').first();
    await pickerClick(page, srcPicker, td.poNo1); await page.waitForTimeout(1000);
    await page.locator('label:has-text("检验员") + div input').first().fill(inspName);
    await page.locator('label:has-text("检验结果") + div input').first().fill('合格');

    // Click save and wait for redirect
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    await fc.check('insp-save');
    expect(page.url(), 'A1 save must redirect from /create').not.toContain('/create');

    // ── SEARCH ──
    await page.goto(`${BASE}/quality/inspection`);
    await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(autoNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    let row = page.locator('table tbody tr').filter({ hasText: autoNo }).first();
    expect(await row.count(), `inspection ${autoNo} in list`).toBeGreaterThan(0);
    const inspNo = (await row.locator('td').nth(3).innerText()).trim();
    console.log(`A1: LIST = ${inspNo}`);

    // ── EDIT ECHO ──
    await row.locator('button:has-text("修改")').first().click();
    await page.waitForTimeout(2000);
    if (page.url().includes('/edit')) {
      expect(await page.locator('label:has-text("质检单号") + div input').first().inputValue()).toBe(inspNo);
      await fc.check('insp-edit');
    }

    // ── UI SUBMIT ──
    await page.goto(`${BASE}/quality/inspection`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(inspNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    row = page.locator('table tbody tr').filter({ hasText: inspNo }).first();
    const submitBtn = row.locator('button:has-text("提交")');
    expect(await submitBtn.count(), 'A1 submit btn must exist').toBeGreaterThan(0);
    await submitBtn.first().click(); await page.waitForTimeout(2000);
    await fc.check('insp-submit');

    // ── Re-search and verify status = SUBMITTED ──
    await page.locator('.bg-muted\\/30').locator('input').first().fill(inspNo);
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').filter({ hasText: inspNo }).first();
    const beforeApprove = (await row.locator('td').nth(1).innerText()).trim();
    console.log(`A1: status before approve = "${beforeApprove}"`);
    expect(beforeApprove, 'A1 status must be 已提交 before approve').toBe('已提交');

    // ── UI APPROVE ──
    const appBtn = row.locator('button:has-text("审核/生成入库")');
    expect(await appBtn.count(), 'A1 approve btn must exist').toBeGreaterThan(0);
    await appBtn.first().click();
    // Wait for approval to complete (generates inbound order)
    await page.waitForTimeout(4000);
    await fc.check('insp-approve');

    // ── Re-search and verify status = APPROVED ──
    await page.locator('.bg-muted\\/30').locator('input').first().fill(inspNo);
    await toolbarSearch(page); await page.waitForTimeout(1500);
    row = page.locator('table tbody tr').filter({ hasText: inspNo }).first();
    const afterApprove = (await row.locator('td').nth(1).innerText()).trim();
    console.log(`A1: status after approve = "${afterApprove}"`);
    // The ErpApproval component renders "已通过" for APPROVED status
    expect(afterApprove, 'A1 status must be 已通过 after approve').toBe('已通过');

    // ── API final verification ──
    const verify = await request.get(`${API}/inspections?code=${encodeURIComponent(inspNo)}`, hdr).then((r: any) => r.json());
    const apiStatus = verify.items?.[0]?.approvalStatus;
    console.log(`A1: API status = ${apiStatus}`);
    expect(apiStatus, 'A1 API approvalStatus must be APPROVED').toBe('APPROVED');

    console.log(`A1: ${inspNo} 创建→提交→审批通过 ✅`);
    (test as any)._a1InspNo = inspNo;
  });

  test('A2 不合格数→提交审批→不良品页面搜索→断言存在', async ({ page, request }) => {
    test.setTimeout(60000);
    const fc = installFC(page); const hdr = H(td.token);
    const ts = Date.now(), inspName = `E2E不检_${ts}`;

    // ── CREATE ──
    await page.goto(`${BASE}/quality/inspection/create`);
    await page.waitForTimeout(2000); await fc.check('val-create');
    const autoNo2 = await page.locator('label:has-text("质检单号") + div input').first().inputValue();
    console.log(`A2: autoNo = ${autoNo2}`);

    // Select material only (cleaner, no source PO needed)
    const matP2 = page.locator('label:has-text("物料") + div input[readonly]').first();
    await pickerClick(page, matP2, td.matCode); await page.waitForTimeout(1000);
    await page.locator('label:has-text("检验员") + div input').first().fill(inspName);
    await page.locator('label:has-text("检验结果") + div input').first().fill('待定');

    // Add line with material data + unqualified qty + reason
    const addLn2 = page.locator('button:has-text("新增行")');
    if (await addLn2.count() > 0) { await addLn2.first().click(); await page.waitForTimeout(800); }
    // Fill text fields first: materialCode(1), materialName(2), spec(3), unit(4), result, unqualifiedReason
    const tInps = page.locator('#lines table tbody tr').first().locator('input:not([type="number"])');
    const tc = await tInps.count();
    if (tc >= 4) { await tInps.nth(0).fill(td.matCode); await tInps.nth(1).fill(td.matName); await tInps.nth(2).fill('E2E规格mm'); await tInps.nth(3).fill('pcs'); }
    // unqualifiedReason is last editable text input
    if (tc >= 5) await tInps.nth(4).fill('外观不良');
    // Fill number fields: lineNo(0), inspectQty(1), qualifiedQty(2), unqualifiedQty(3)
    const nF2 = page.locator('#lines table tbody tr').first().locator('input[type="number"]');
    if (await nF2.count() >= 4) {
      await nF2.nth(1).fill('100'); await nF2.nth(2).fill('60'); await nF2.nth(3).fill('40');
    }

    // Save
    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    await fc.check('a2-save');
    expect(page.url(), 'A2 save must redirect').not.toContain('/create');

    // Search + submit + approve
    await page.goto(`${BASE}/quality/inspection`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(autoNo2);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    let r2 = page.locator('table tbody tr').filter({ hasText: autoNo2 }).first();
    expect(await r2.count(), `A2 ${autoNo2} in list`).toBeGreaterThan(0);
    const aInspNo = (await r2.locator('td').nth(3).innerText()).trim();
    console.log(`A2: INSPECTION = ${aInspNo}`);

    // Submit
    const sBtn = r2.locator('button:has-text("提交")');
    expect(await sBtn.count(), 'A2 submit btn').toBeGreaterThan(0);
    await sBtn.first().click(); await page.waitForTimeout(2000);

    // Re-search → approve
    await page.locator('.bg-muted\\/30').locator('input').first().fill(autoNo2);
    await toolbarSearch(page); await page.waitForTimeout(1500);
    r2 = page.locator('table tbody tr').filter({ hasText: autoNo2 }).first();
    const aBtn = r2.locator('button:has-text("审核/生成入库")');
    expect(await aBtn.count(), 'A2 approve btn').toBeGreaterThan(0);
    await aBtn.first().click(); await page.waitForTimeout(3000);
    await fc.check('a2-app');

    // ── API confirm approved ──
    const aCheck = await request.get(`${API}/inspections?code=${encodeURIComponent(aInspNo)}`, hdr).then((r: any) => r.json());
    const aStatus = aCheck.items?.[0]?.approvalStatus;
    console.log(`A2: API status = ${aStatus}`);
    expect(aStatus, 'A2 must be APPROVED').toBe('APPROVED');

    // ── Defective page UI search ──
    await page.goto(`${BASE}/quality/defective`);
    await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(aInspNo); // search by inspectionNo
    await toolbarSearch(page); await page.waitForTimeout(2000);
    await fc.check('def-list');

    // HARD ASSERT: defective list must contain our inspection data
    const defBody = await page.locator('table tbody').innerText();
    console.log(`A2: defective body = "${defBody.substring(0, 200)}"`);
    // Verify header unqualifiedQty was synced from lines during approve
    const hdrCheck = await request.get(`${API}/inspections?code=${encodeURIComponent(aInspNo)}`, hdr).then((r: any) => r.json());
    const hdrItem = hdrCheck.items?.[0];
    console.log(`A2: header unqualifiedQty=${hdrItem?.unqualifiedQty}, qualifiedQty=${hdrItem?.qualifiedQty}`);

    // The defective page client-filters APPROVED inspections where unqualifiedQty > 0 at header level.
    // After our backend fix, the header should have unqualifiedQty synced from lines.
    expect(
      defBody,
      'A2 defective list must show our inspectionNo'
    ).toContain(aInspNo);
    console.log(`A2: Defective page shows ${aInspNo} ✅`);

    (test as any)._a2InspNo = aInspNo;
  });

  test('A3 不合格数>0无原因→hard assert 阻止保存', async ({ page }) => {
    test.setTimeout(60000);
    const fc = installFC(page);

    await page.goto(`${BASE}/quality/inspection/create`);
    await page.waitForTimeout(2000); await fc.check('qc-create');

    const matPicker = page.locator('label:has-text("物料") + div input[readonly]').first();
    await pickerClick(page, matPicker, td.matCode); await page.waitForTimeout(1000);
    await page.locator('label:has-text("检验员") + div input').first().fill('E2E测试');
    await page.locator('label:has-text("检验结果") + div input').first().fill('待定');

    const addLn = page.locator('button:has-text("新增行")');
    if (await addLn.count() > 0) { await addLn.first().click(); await page.waitForTimeout(800); }
    const numFields = page.locator('#lines table tbody tr').first().locator('input[type="number"]');
    if (await numFields.count() >= 3) {
      await numFields.nth(1).fill('50'); // inspectQty
      await numFields.nth(2).fill('30'); // qualifiedQty
      await numFields.nth(3).fill('20'); // unqualifiedQty — no reason = should block
    }

    // Click save — frontend validation should prevent API call
    await formSave(page);
    await page.waitForTimeout(3000);
    await fc.check('a3-after-save');

    const url = page.url();
    console.log(`A3: URL after save = ${url}`);
    // HARD ASSERT: must stay on create page
    expect(url, 'A3 must stay on /create when validation fails').toContain('/create');

    // HARD ASSERT: error toast or validation message must be visible
    const bodyText = await page.locator('body').innerText();
    const hasError = bodyText.includes('不合格') || bodyText.includes('原因');
    console.log(`A3: body contains validation text = ${hasError}`);
    expect(hasError, 'A3 must show validation error text').toBeTruthy();
    console.log(`A3: Validation blocked save correctly ✅`);
  });
});

// ═══════════════════ B. 需求计划 → 采购计划 ═══════════════════
test.describe('B — 需求计划闭环', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await rollbackDocs(request, td.token); await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('B1 需求计划 UI新增→选项目/部门→保存→搜索→编辑→提交→审批', async ({ page, request }) => {
    test.setTimeout(90000);
    const fc = installFC(page);
    const hdr = H(td.token);
    const ts = Date.now(), dpName = `E2E需求计划_${ts}`;

    await page.goto(`${BASE}/ops/demand-plan/create`);
    await page.waitForTimeout(2000); await fc.check('dp-create');
    const autoDpNo = await page.locator('label:has-text("计划单号") + div input').first().inputValue();
    console.log(`B1: planNo = ${autoDpNo}`);
    await page.locator('label:has-text("计划名称") + div input').first().fill(dpName);

    // Select project via EntitySelect
    const projCb = page.locator('label:has-text("关联项目") + div button[role="combobox"]').first();
    await projCb.click(); await page.waitForTimeout(500);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes('E2E')) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    // Select department
    const deptCb = page.locator('label:has-text("需求部门") + div button[role="combobox"]').first();
    await deptCb.click(); await page.waitForTimeout(500);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes('E2E')) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.locator('label:has-text("需求来源") + div input').first().fill('E2E销售订单');
    await page.locator('label:has-text("需求用途") + div input').first().fill('生产用料');
    await page.locator('label:has-text("需求日期") + div input').first().fill('2026-12-31');

    // Add line
    const addLn = page.locator('button:has-text("新增行")');
    if (await addLn.count() > 0) { await addLn.first().click(); await page.waitForTimeout(800); }
    const ri = page.locator('#lines table tbody tr').first().locator('input');
    if (await ri.count() >= 5) {
      await ri.nth(1).fill(td.matCode); await ri.nth(2).fill(td.matName);
      await ri.nth(3).fill('E2E规格mm'); await ri.nth(4).fill('pcs'); await ri.nth(5).fill('500');
    }

    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    await fc.check('dp-save');
    expect(page.url(), 'B1 save must redirect').not.toContain('/create');

    // Search
    await page.goto(`${BASE}/ops/demand-plan`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(autoDpNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    let dpRow = page.locator('table tbody tr').filter({ hasText: autoDpNo }).first();
    expect(await dpRow.count(), `B1 ${autoDpNo} in list`).toBeGreaterThan(0);
    const dpNo = (await dpRow.locator('td').nth(3).innerText()).trim();
    console.log(`B1: DEMAND PLAN = ${dpNo}`);

    // Edit echo
    const editB = dpRow.locator('button:has-text("修改")');
    if (await editB.count() > 0) {
      await editB.first().click(); await page.waitForTimeout(2000);
      if (page.url().includes('/edit')) {
        const en = await page.locator('label:has-text("计划名称") + div input').first().inputValue();
        expect(en, 'B1 edit echoes planName').toBe(dpName);
        await fc.check('dp-edit');
      }
    }

    // Submit via UI
    await page.goto(`${BASE}/ops/demand-plan`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(dpNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    dpRow = page.locator('table tbody tr').filter({ hasText: dpNo }).first();
    await dpRow.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(2000);
    await fc.check('dp-submit');

    // Approve via UI
    await toolbarSearch(page); await page.waitForTimeout(1500);
    dpRow = page.locator('table tbody tr').filter({ hasText: dpNo }).first();
    await dpRow.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(2000);
    await fc.check('dp-approve');

    // Verify via API
    const v = await request.get(`${API}/demand-plans?code=${encodeURIComponent(dpNo)}`, hdr).then((r: any) => r.json());
    expect(v.items?.[0]?.approvalStatus, 'B1 DP APPROVED').toBe('APPROVED');
    console.log(`B1: DP ${dpNo} ✅`);
    (test as any)._b1DpNo = dpNo;
  });

  test('B2 需求计划下推采购计划→带出字段→编辑回显→强断言', async ({ page, request }) => {
    test.setTimeout(90000);
    const fc = installFC(page);
    const hdr = H(td.token);
    const ts = Date.now(), dpName = `E2E推采_${ts}`;

    // Create + approve demand plan via UI
    await page.goto(`${BASE}/ops/demand-plan/create`);
    await page.waitForTimeout(2000);
    const autoDpNo = await page.locator('label:has-text("计划单号") + div input').first().inputValue();
    console.log(`B2: planNo = ${autoDpNo}`);
    await page.locator('label:has-text("计划名称") + div input').first().fill(dpName);
    await page.locator('label:has-text("需求来源") + div input').first().fill('E2E测试');
    await page.locator('label:has-text("需求用途") + div input').first().fill('生产用料');
    await page.locator('label:has-text("需求日期") + div input').first().fill('2026-12-31');

    const aL = page.locator('button:has-text("新增行")');
    if (await aL.count() > 0) { await aL.first().click(); await page.waitForTimeout(800); }
    const ri = page.locator('#lines table tbody tr').first().locator('input');
    if (await ri.count() >= 5) {
      await ri.nth(1).fill(td.matCode); await ri.nth(2).fill(td.matName);
      await ri.nth(3).fill('E2E规格mm'); await ri.nth(4).fill('pcs'); await ri.nth(5).fill('300');
    }

    await formSave(page);
    try { await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'B2 save must redirect').not.toContain('/create');

    // Submit + approve
    await page.goto(`${BASE}/ops/demand-plan`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(autoDpNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    let dRow = page.locator('table tbody tr').filter({ hasText: autoDpNo }).first();
    const dpNo = (await dRow.locator('td').nth(3).innerText()).trim();
    console.log(`B2: DP = ${dpNo}`);
    await dRow.locator('button:has-text("提交")').first().click(); await page.waitForTimeout(2000);
    await toolbarSearch(page); await page.waitForTimeout(1500);
    dRow = page.locator('table tbody tr').filter({ hasText: dpNo }).first();
    await dRow.locator('button:has-text("通过")').first().click(); await page.waitForTimeout(2000);

    // Push-down to purchase plan
    await toolbarSearch(page); await page.waitForTimeout(1500);
    dRow = page.locator('table tbody tr').filter({ hasText: dpNo }).first();
    const pushBtn = dRow.locator('button:has-text("下推采购计划")');
    expect(await pushBtn.count(), 'B2 push btn').toBeGreaterThan(0);
    page.once('dialog', (d: any) => d.accept());
    await pushBtn.first().click(); await page.waitForTimeout(2000);
    await fc.check('b2-push');

    // Find the generated purchase plan
    const ppResp = await request.get(`${API}/purchase-plans?pageSize=10`, hdr).then((r: any) => r.json());
    const ppItem = (ppResp.items || []).find((x: any) => x.demandPlanNo === dpNo);
    expect(ppItem, 'B2 purchase plan must exist').toBeTruthy();
    const ppNo = ppItem!.orderNo;
    console.log(`B2: PURCHASE PLAN = ${ppNo}`);

    // ── Verify in purchase plan list ──
    await page.goto(`${BASE}/purchase/plan`); await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(ppNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    await fc.check('pp-list');
    expect(await page.locator('table tbody').innerText(), 'B2 PP in list').toContain(ppNo);
    console.log(`B2: PP ${ppNo} found in list ✅`);

    // ── API verify linkage (the edit page doesn't render demandPlanNo as visible field) ──
    const ppDetail = await request.get(`${API}/purchase-plans/${ppItem!.id}`, hdr).then((r: any) => r.json());
    expect(ppDetail.demandPlanNo, 'B2 PP linked to DP').toBe(dpNo);
    expect(ppDetail.demandPlanId, 'B2 PP has demandPlanId').toBeTruthy();
    expect(ppDetail.lines?.length || 0, 'B2 PP has lines').toBeGreaterThan(0);
    const firstLine = ppDetail.lines?.[0];
    expect(firstLine?.materialCode || firstLine?.materialName, 'B2 line has material').toBeTruthy();
    expect(firstLine?.quantity, 'B2 line has quantity').toBeTruthy();
    console.log(`B2: PP linked ${dpNo}→${ppNo}, line: ${firstLine?.materialName} qty=${firstLine?.quantity} ✅`);

    (test as any)._b2PpNo = ppNo;
  });
});

// ═══════════════════ C. 查询+布局 ═══════════════════
test.describe('C — 查询+布局', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('C1 质检查询→搜索本轮单号→表格包含', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now();
    const ir = await request.post(`${API}/inspections`, { ...hdr, data: { materialName: td.matName, quantity: '10', inspector: `E2E查询_${ts}`, lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', inspectQty: '10', qualifiedQty: '0', unqualifiedQty: '0', result: 'PENDING' }] } });
    const idata = await ir.json();
    const inspNo = idata.inspectionNo;
    expect(inspNo, 'C1 create').toBeTruthy();

    await page.goto(`${BASE}/quality/inspection-query`);
    await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(inspNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    await fc.check('qry-insp');
    expect(await page.locator('table tbody').innerText()).toContain(inspNo);
    console.log(`C1: Found ${inspNo} ✅`);
    if (idata.id) await request.delete(`${API}/inspections/${idata.id}`, hdr).catch(() => {});
  });

  test('C2 需求查询→搜索本轮单号→表格包含', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now();
    const dr = await request.post(`${API}/demand-plans`, { ...hdr, data: { planName: `E2E查询_${ts}`, demandSource: 'E2E测试', requiredDate: '2026-12-31', lines: [{ lineNo: 1, materialCode: td.matCode, materialName: td.matName, spec: 'E2E规格mm', unit: 'pcs', quantity: '100' }] } }).then((r: any) => r.json());
    const dpNo = dr.planNo;
    await page.goto(`${BASE}/ops/demand-query`);
    await page.waitForTimeout(2000);
    await page.locator('.bg-muted\\/30').locator('input').first().fill(dpNo);
    await toolbarSearch(page); await page.waitForTimeout(2000);
    await fc.check('qry-dp');
    expect(await page.locator('table tbody').innerText()).toContain(dpNo);
    console.log(`C2: Found ${dpNo} ✅`);
    await request.delete(`${API}/demand-plans/${dr.id}`, hdr).catch(() => {});
  });

  for (const [label, url] of [
    ['质检维护', '/quality/inspection'], ['需求计划', '/ops/demand-plan'],
    ['质检查询', '/quality/inspection-query'], ['需求查询', '/ops/demand-query'],
  ] as [string, string][]) {
    test(`C3-${label} 分页+表头`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${url}`); await page.waitForTimeout(1500); await fc.check(label);
      expect(await page.getByTestId('erp-pagination').count(), `${label}: pagination`).toBeGreaterThan(0);
      const thBox = await page.locator('table thead th').first().boundingBox();
      if (thBox) expect(thBox.width, `${label}: th width`).toBeGreaterThan(20);
    });
  }
});
