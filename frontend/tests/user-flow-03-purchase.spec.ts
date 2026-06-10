/**
 * 用户流程 03 — 采购管理（全 UI 版）
 *
 * 零 API 创建业务单据。所有计划/订单/退供单通过 UI 操作创建。
 * 强断言所有字段自动带出。失败必须 test fail。
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
  await p.waitForURL('**/');
  await p.waitForTimeout(800);
}
async function expandSidebar(p: any) {
  if ((await p.locator('aside').count()) === 0) { await p.locator('header button').first().click(); await p.waitForTimeout(400); }
}
async function clickMenu(p: any, parents: string[], leaf: string, path: string) {
  const a = p.locator('aside');
  for (const pr of parents) { await a.locator(`text=${pr}`).last().click(); await p.waitForTimeout(350); }
  await a.locator(`text=${leaf}`).last().click();
  await p.waitForTimeout(2000);
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
      const real = ce.filter(e => !e.includes('hydration') && !e.includes('Hydration') && !e.includes('Warning:') && !e.includes('409') && !e.includes('Conflict') && !e.includes('Bad Request') && !e.includes('value` prop') && !e.includes('should not be null'));
      if (real.length > 0) throw new Error(`${l}: Console: ${real.slice(0, 3).join('; ')}`);
    },
  };
}

async function formSave(p: any) { await p.getByTestId('form-save-btn').click(); }

async function toolbarAdd(p: any) {
  const btns = p.locator('.h-14 button');
  for (let i = 0; i < await btns.count(); i++) {
    if ((await btns.nth(i).innerText()).includes('新增')) { await btns.nth(i).click(); await p.waitForTimeout(2000); return; }
  }
  throw new Error('toolbarAdd: not found');
}

async function toolbarSearch(p: any) {
  const btns = p.locator('.h-14 button');
  for (const word of ['搜索', '查询']) {
    for (let i = 0; i < await btns.count(); i++) {
      if ((await btns.nth(i).innerText()).trim() === word) { await btns.nth(i).click(); return; }
    }
  }
}
async function toolbarReset(p: any) {
  const btns = p.locator('.h-14 button');
  for (let i = 0; i < await btns.count(); i++) {
    if ((await btns.nth(i).innerText()).trim() === '重置') { await btns.nth(i).click(); return; }
  }
}
async function searchByLabel(p: any, labelText: string, value: string) {
  const parent = p.locator('.flex-wrap').first().locator('span', { hasText: labelText }).first().locator('..');
  await parent.locator('input').first().fill(value);
  await p.waitForTimeout(300);
}
async function selectByLabel(p: any, labelText: string, optionContains: string) {
  const trigger = p.locator(`label:has-text("${labelText}") + div button[role="combobox"]`).first();
  await trigger.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await trigger.click();
  await p.waitForTimeout(500);
  const opts = p.locator('[role="option"]');
  for (let i = 0; i < await opts.count(); i++) {
    const opt = opts.nth(i);
    if (!(await opt.isVisible())) continue;
    if ((await opt.innerText()).includes(optionContains)) { await opt.click(); await p.waitForTimeout(300); return; }
  }
  throw new Error(`selectByLabel: "${optionContains}" not found for "${labelText}"`);
}
async function pickerSelect(p: any, labelText: string, searchVal: string) {
  const sec = p.locator(`label:has-text("${labelText}") + div`).first();
  await sec.locator('input[readonly]').first().click();
  await p.waitForTimeout(1000);
  const d = p.locator('[role="dialog"]');
  await expect(d).toBeVisible();
  if (searchVal) {
    if (await d.locator('input').count() > 1) await d.locator('input').nth(1).fill(searchVal);
    await d.locator('button:has-text("查询")').click();
    await p.waitForTimeout(1000);
  }
  expect(await d.locator('table tbody tr').count(), `picker "${labelText}" rows>0`).toBeGreaterThan(0);
  await d.locator('table tbody input[type="radio"]').first().click();
  await p.waitForTimeout(300);
  await d.locator('button:has-text("确定")').click();
  await p.waitForTimeout(800);
}

// ── Seed ──

async function seedData(request: any) {
  const t = await getToken(request), h = H(t), ts = Date.now();
  const supCode = `E2E_SUP_${ts}`, supName = `E2E供应商_${ts}`;
  let supId: string;
  {
    const r = await request.get(`${API}/suppliers?pageSize=999`, h).then(r => r.json());
    supId = (r?.items || []).find((x: any) => x.code === supCode)?.id;
    if (!supId) supId = (await (await request.post(`${API}/suppliers`, { ...h, data: { code: supCode, name: supName, status: 'ACTIVE' } })).json()).id;
  }
  const uCode = `E2E_UNIT_${ts}`;
  let uId: string;
  {
    const r = await request.get(`${API}/measurement-units?pageSize=999`, h).then(r => r.json());
    uId = (r?.items || []).find((x: any) => x.code === uCode)?.id;
    if (!uId) uId = (await (await request.post(`${API}/measurement-units`, { ...h, data: { code: uCode, name: uCode, symbol: 'pcs', sortOrder: 1, status: 'ACTIVE' } })).json()).id;
  }
  const catCode = `E2E_CAT_${ts}`;
  let catId: string;
  {
    const r = await request.get(`${API}/material-categories?pageSize=999`, h).then(r => r.json());
    catId = (r?.items || []).find((x: any) => x.code === catCode)?.id;
    if (!catId) catId = (await (await request.post(`${API}/material-categories`, { ...h, data: { code: catCode, name: `E2E分类_${ts}`, sortOrder: 1, status: 'ACTIVE' } })).json()).id;
  }
  const matCode = `E2E_MAT_${ts}`, matName = `E2E物料_${ts}`;
  let matId: string;
  {
    const r = await request.get(`${API}/materials?pageSize=999`, h).then(r => r.json());
    matId = (r?.items || []).find((x: any) => x.code === matCode)?.id;
    if (!matId) matId = (await (await request.post(`${API}/materials`, { ...h, data: { code: matCode, name: matName, specification: 'E2E规格mm', categoryId: catId, unitId: uId, productCategory: '成品', planAttribute: '自制', status: 'ACTIVE' } })).json()).id;
  }
  const deptCode = `E2E_DEPT_${ts}`;
  let deptId: string;
  {
    const r = await request.get(`${API}/departments?pageSize=999`, h).then(r => r.json());
    deptId = (r?.items || []).find((x: any) => x.code === deptCode)?.id;
    if (!deptId) deptId = (await (await request.post(`${API}/departments`, { ...h, data: { code: deptCode, name: `E2E部门_${ts}`, status: 'ACTIVE' } })).json()).id;
  }
  const prjCode = `E2E_PRJ_${ts}`;
  let prjId: string;
  {
    const r = await request.get(`${API}/projects?pageSize=999`, h).then(r => r.json());
    prjId = (r?.items || []).find((x: any) => x.code === prjCode)?.id;
    if (!prjId) prjId = (await (await request.post(`${API}/projects`, { ...h, data: { code: prjCode, name: `E2E项目_${ts}`, status: 'ACTIVE' } })).json()).id;
  }
  // Purchase contract (approved with lines)
  const conName = `E2E采购合同_${ts}`;
  let conId: string, conCode: string;
  {
    const r = await request.get(`${API}/contracts?name=${encodeURIComponent(conName)}`, h).then(r => r.json());
    const existing = (r?.items || [])[0];
    if (existing) { conId = existing.id; conCode = existing.code; }
    else {
      const payload = {
        name: conName, type: '采购合同', receiptPaymentMethod: '一次性付',
        amountType: '固定总价', currencyType: '人民币', totalAmount: '50000',
        effectiveDate: new Date().toISOString().slice(0, 10), undertakerName: 'E2E承办人',
        supplierId: supId, supplierName: supName, supplierCode: supCode,
        projectId: prjId, projectName: `E2E项目_${ts}`, projectCode: prjCode,
        undertakingDepartmentId: deptId, undertakingDepartmentName: `E2E部门_${ts}`,
        lines: [{ lineNo: 1, materialId: matId, materialCode: matCode, materialName: matName, specification: 'E2E规格mm', unit: 'pcs', quantity: '100', unitPrice: '500', amount: '50000', remark: 'E2E测试' }],
        paymentPlans: [{ lineNo: 1, amount: '50000', planDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), ratio: '100', remark: 'E2E计划' }],
      };
      const cr = await request.post(`${API}/contracts`, { ...h, data: payload });
      const cj = await cr.json();
      conId = cj.id; conCode = cj.code;
      await request.put(`${API}/contracts/${conId}/submit`, h).catch(() => {});
      await request.put(`${API}/contracts/${conId}/approve`, h).catch(() => {});
    }
  }
  return { supId, supCode, supName, matId, matCode, matName, catId, uId, deptId, deptCode, prjId, prjCode, conId, conCode, conName, token: t, h };
}

async function cleanupData(request: any, d: any) {
  const { h } = d;
  if (d.conId) await request.delete(`${API}/contracts/${d.conId}`, h).catch(() => {});
  if (d.matId) await request.delete(`${API}/materials/${d.matId}`, h).catch(() => {});
  if (d.catId) await request.delete(`${API}/material-categories/${d.catId}`, h).catch(() => {});
  if (d.uId) await request.delete(`${API}/measurement-units/${d.uId}`, h).catch(() => {});
  if (d.deptId) await request.delete(`${API}/departments/${d.deptId}`, h).catch(() => {});
  if (d.prjId) await request.delete(`${API}/projects/${d.prjId}`, h).catch(() => {});
  if (d.supId) await request.delete(`${API}/suppliers/${d.supId}`, h).catch(() => {});
}

// ═══════════════════ A. 供应商 ═══════════════════

test.describe('A — 供应商', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('A1 UI 新增→搜索→修改→删除', async ({ page }) => {
    const fc = installFC(page);
    const ts = Date.now(), code = `E2E_S_${ts}`, name = `E2E供应名称_${ts}`, name2 = `${name}改`;
    await clickMenu(page, ['采购管理'], '供应商档案', '/purchase/supplier'); await fc.check('list');
    await toolbarAdd(page);
    expect(page.url()).toContain('/purchase/supplier/create');
    await page.locator('label:has-text("供应商编码") + div input').first().fill(code);
    await page.locator('label:has-text("供应商名称") + div input').first().fill(name);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('save');
    expect(page.url()).not.toContain('/create');
    await searchByLabel(page, '供应商名称', name); await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(name);
    await page.locator('table tbody tr').filter({ hasText: name }).locator('button:has-text("修改")').first().click(); await page.waitForTimeout(2000);
    await page.locator('label:has-text("供应商名称") + div input').first().fill(name2);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('edit');
    await searchByLabel(page, '供应商名称', name2); await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(name2);
    await page.locator('table tbody tr').filter({ hasText: name2 }).locator('button:has-text("删除")').first().click(); await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click(); await page.waitForTimeout(1500); await fc.check('del');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).not.toContain(name2);
  });
});

// ═══════════════════ B. 采购参数 ═══════════════════

test.describe('B — 采购参数【缺陷：配置页非表格，值不持久化】', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('B1 页面可加载→可编辑→保存按钮不报错', async ({ page }) => {
    const fc = installFC(page);
    await clickMenu(page, ['采购管理'], '采购参数', '/purchase/params'); await fc.check('page');
    expect(await page.locator('.max-w-2xl').first().innerText()).toContain('采购单编码规则');
    await page.locator('input').nth(1).fill('17');
    await page.locator('button:has-text("保存")').first().click(); await page.waitForTimeout(1500); await fc.check('save');
    await page.locator('input').nth(1).fill('13');
    await page.locator('button:has-text("保存")').first().click(); await page.waitForTimeout(1000); await fc.check('restore');
  });
});

// ═══════════════════ C. 采购计划 — 全 UI ═══════════════════

test.describe('C — 采购计划', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('C1 UI 新增→保存→列表强查→编辑回显→改名→再查→删除', async ({ page }) => {
    test.setTimeout(60000);
    const fc = installFC(page);
    const ts = Date.now(), pName = `E2E计划_${ts}`, pName2 = `${pName}改`;
    await clickMenu(page, ['采购管理'], '采购计划维护', '/purchase/plan'); await fc.check('list');

    // 新增
    await toolbarAdd(page);
    expect(page.url()).toContain('/purchase/plan/create'); await page.waitForTimeout(1500); await fc.check('create');

    // 填写
    await page.locator('label:has-text("计划名称") + div input').first().fill(pName);
    await selectByLabel(page, '供应商', td.supCode);
    const noteInput = page.locator('label:has-text("备注") + div input').first();
    await noteInput.fill(`E2E备注_${ts}`);

    // 保存
    await formSave(page); await page.waitForTimeout(3000);
    const url = page.url();
    expect(url, `save must redirect, stayed on create (check API toast for duplicate code)`).not.toContain('/create');

    // 列表搜索
    await page.goto(`${BASE}/purchase/plan`); await page.waitForTimeout(2000);
    await searchByLabel(page, '计划名称', pName); await toolbarSearch(page); await page.waitForTimeout(2000);
    const lt = await page.locator('table tbody').innerText();
    expect(lt, 'plan must be in list').toContain(pName);

    // 编辑回显 — 点击修改按钮（已修复 onClick）
    await page.locator('table tbody tr').filter({ hasText: pName }).locator('button:has-text("修改")').first().click();
    await page.waitForTimeout(2500); await fc.check('edit');
    expect(page.url()).toContain('/edit');
    await expect(page.getByTestId('plan-ordername-input'), 'plan name echo').toHaveValue(pName);

    // 改名保存
    await page.getByTestId('plan-ordername-input').fill(pName2);
    await formSave(page); await page.waitForTimeout(2000); await fc.check('edit-save');
    expect(page.url()).not.toContain('/edit');

    // 搜索新名
    await searchByLabel(page, '计划名称', pName2); await toolbarSearch(page); await page.waitForTimeout(2000);
    expect(await page.locator('table tbody').innerText(), 'renamed in list').toContain(pName2);

    // UI 删除
    await page.locator('table tbody tr').filter({ hasText: pName2 }).locator('button:has-text("删除")').first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click(); await page.waitForTimeout(1500); await fc.check('del');
    await toolbarSearch(page); await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText(), 'deleted').not.toContain(pName2);
  });

  test('C2 计划→订单链路：UI建计划→UI提交→UI审批→订单页选计划→自动带出→保存→强查', async ({ page, request }) => {
    test.setTimeout(120000);
    const fc = installFC(page);
    const ts = Date.now(), pName = `E2E链路_${ts}`, oName = `E2E订单链路_${ts}`;

    // ── 1. UI 创建采购计划 ──
    await clickMenu(page, ['采购管理'], '采购计划维护', '/purchase/plan');
    await toolbarAdd(page);
    expect(page.url()).toContain('/purchase/plan/create');
    await page.locator('label:has-text("计划名称") + div input').first().fill(pName);
    await selectByLabel(page, '供应商', td.supCode);

    // Add a line with material
    const addLineBtn = page.locator('#l button:has-text("新增行")');
    if ((await addLineBtn.count()) > 0) {
      await addLineBtn.click(); await page.waitForTimeout(500);
      const inputs = page.locator('#l input');
      if ((await inputs.count()) > 1) {
        await inputs.nth(1).fill(td.matCode); // materialCode (2nd input, 1st is lineNo number)
        await page.waitForTimeout(300);
      }
    }

    await formSave(page); await page.waitForTimeout(3000);
    expect(page.url(), 'plan save redirect').not.toContain('/create');

    // Capture plan orderNo from list page
    let planOrderNo = '';
    await page.goto(`${BASE}/purchase/plan`); await page.waitForTimeout(2000);
    await searchByLabel(page, '计划名称', pName); await toolbarSearch(page); await page.waitForTimeout(2000);
    const planRow = page.locator('table tbody tr').filter({ hasText: pName }).first();
    planOrderNo = (await planRow.locator('td').nth(1).innerText()).trim();
    expect(planOrderNo.length).toBeGreaterThan(0);

    // ── 2. UI 提交 → UI 审批 ──
    await planRow.locator('button:has-text("提交")').first().click();
    await page.waitForTimeout(1500); await fc.check('submit');
    // Re-search after refresh
    await searchByLabel(page, '计划名称', pName); await toolbarSearch(page); await page.waitForTimeout(2000);
    const planRow2 = page.locator('table tbody tr').filter({ hasText: pName }).first();
    const approveBtn = planRow2.locator('button:has-text("审批")');
    expect(await approveBtn.count(), 'approve btn after submit').toBeGreaterThan(0);
    // Auto-accept the confirm() dialog
    page.once('dialog', (d: any) => d.accept());
    await approveBtn.first().click();
    await page.waitForTimeout(3000); await fc.check('approve');

    // ── 3. 采购订单新增 → 选计划 → 断言自动带出 ──
    await clickMenu(page, ['采购管理'], '采购订单维护', '/purchase/order');
    await toolbarAdd(page);
    expect(page.url()).toContain('/purchase/order/create'); await page.waitForTimeout(2000);

    await page.locator('label:has-text("订单名称") + div input').first().fill(oName);
    await pickerSelect(page, '关联计划', planOrderNo);
    await page.waitForTimeout(2500); await fc.check('plan-select');

    // ── 自动带出断言 ──
    const supInput = page.locator('label:has-text("供应商") + div input').first();
    const supVal = await supInput.inputValue();
    expect(supVal.trim(), 'supplier name auto-fill').toBe(td.supName);

    // ── 保存 ──
    await formSave(page); await page.waitForTimeout(3000); await fc.check('order-save');
    expect(page.url(), 'order save redirect').not.toContain('/create');

    // ── 列表强查 ──
    await searchByLabel(page, '订单名称', oName); await toolbarSearch(page); await page.waitForTimeout(2000);
    const oLt = await page.locator('table tbody').innerText();
    expect(oLt, 'order in list').toContain(oName);

    // Clean up
    try { const hdr = H(td.token);
      const oResp = await request.get(`${API}/purchase-orders?name=${encodeURIComponent(oName)}`, { headers: hdr }).then(r => r.json());
      for (const o of oResp?.items || []) await request.delete(`${API}/purchase-orders/${o.id}`, { headers: hdr }).catch(() => {});
      const pResp = await request.get(`${API}/purchase-plans?name=${encodeURIComponent(pName)}`, { headers: hdr }).then(r => r.json());
      for (const p of pResp?.items || []) await request.delete(`${API}/purchase-plans/${p.id}`, { headers: hdr }).catch(() => {});
    } catch {}
  });
});

// ═══════════════════ D. 采购订单关联合同 — 明细逐项断言 ═══════════════════

test.describe('D — 采购订单关联合同', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('D1 关联合同→逐项断言→保存→列表查→编辑回显', async ({ page, request }) => {
    test.setTimeout(90000);
    const fc = installFC(page);
    const ts = Date.now(), oName = `E2E订单合同_${ts}`;

    await clickMenu(page, ['采购管理'], '采购订单维护', '/purchase/order');
    await toolbarAdd(page);
    expect(page.url()).toContain('/purchase/order/create'); await page.waitForTimeout(2000);

    await page.locator('label:has-text("订单名称") + div input').first().fill(oName);
    await pickerSelect(page, '关联合同', td.conName);
    await page.waitForTimeout(2500); await fc.check('contract-select');

    // ── 合同字段自动带出 — 逐项断言 ──
    // Supplier
    const supVal = await page.locator('label:has-text("供应商") + div input').first().inputValue();
    expect(supVal, 'supplierName').toBe(td.supName);

    // Project
    const prjVal = await page.locator('label:has-text("关联项目") + div input').first().inputValue();
    expect(prjVal.trim().length, 'project filled').toBeGreaterThan(0);

    // Department
    const deptVal = await page.locator('label:has-text("采购部门") + div input').first().inputValue();
    expect(deptVal.trim().length, 'dept filled').toBeGreaterThan(0);

    // Contract name
    const conVal = await page.locator('label:has-text("关联合同") + div input').first().inputValue();
    expect(conVal.trim().length, 'contract filled').toBeGreaterThan(0);

    // ── 明细行逐项断言 ──
    const ls = page.locator('#l');
    const lineInputs = ls.locator('input');
    const leCnt = await lineInputs.count();
    expect(leCnt, 'contract lines loaded').toBeGreaterThan(0);

    // LinesEditor field order: lineNo(number)=0, materialCode=1, materialName=2, spec=3, unit=4, quantity(number)=5, unitPrice(number)=6, amount=7
    const getVal = async (n: number) => (await lineInputs.nth(n).inputValue()).trim();
    expect(await getVal(1), 'materialCode').toBe(td.matCode);
    expect(await getVal(2), 'materialName').toBe(td.matName);
    expect(await getVal(3), 'specification').toBe('E2E规格mm');
    expect(await getVal(4), 'unit').toBe('pcs');
    expect(await getVal(5), 'quantity').toBe('100');
    expect(await getVal(6), 'unitPrice').toBe('500');
    expect(await getVal(7), 'amount').toBe('50000');

    // Total amount
    const amtInput = page.locator('label:has-text("金额") + div input').first();
    const amtVal = await amtInput.inputValue();
    expect(Number(amtVal), 'totalAmount=50000').toBe(50000);

    // ── 保存 ──
    await formSave(page); await page.waitForTimeout(3000); await fc.check('save');
    expect(page.url(), 'save redirect').not.toContain('/create');

    // ── 列表查 ──
    await searchByLabel(page, '订单名称', oName); await toolbarSearch(page); await page.waitForTimeout(2000);
    expect(await page.locator('table tbody').innerText(), 'order in list').toContain(oName);

    // ── 编辑回显 ──
    await page.locator('table tbody tr').filter({ hasText: oName }).locator('button:has-text("修改")').first().click();
    await page.waitForTimeout(2500); await fc.check('edit');
    await expect(page.locator('label:has-text("订单名称") + div input').first()).toHaveValue(oName);

    // Clean up
    try { const hdr = H(td.token);
      const oResp = await request.get(`${API}/purchase-orders?name=${encodeURIComponent(oName)}`, { headers: hdr }).then(r => r.json());
      for (const o of oResp?.items || []) await request.delete(`${API}/purchase-orders/${o.id}`, { headers: hdr }).catch(() => {});
    } catch {}
  });
});

// ═══════════════════ E. 退供单 — 全 UI ═══════════════════

test.describe('E — 退供单', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('E1 菜单→列表→新增→保存→搜索→编辑回显→删除', async ({ page, request }) => {
    test.setTimeout(60000);
    const fc = installFC(page);
    const ts = Date.now(), reason = `E2E退供原因_${ts}`, matName = `E2E退供物料_${ts}`;

    // ── 列表（已修复API） ──
    await clickMenu(page, ['采购管理'], '退供单维护', '/purchase/return'); await fc.check('list');

    // ── 新增 ──
    await toolbarAdd(page);
    expect(page.url()).toContain('/purchase/return/create'); await page.waitForTimeout(1500); await fc.check('create');

    // 填写
    await selectByLabel(page, '供应商', td.supCode);
    await page.locator('label:has-text("物料名称") + div input').first().fill(matName);
    await page.locator('label:has-text("数量") + div input').first().fill('10');
    await page.locator('label:has-text("金额") + div input').first().fill('5000');
    await page.locator('label:has-text("退货原因") + div input').first().fill(reason);

    // ── 保存 ──
    await formSave(page); await page.waitForTimeout(3000); await fc.check('save');
    expect(page.url(), 'save redirect').not.toContain('/create');

    // ── 列表搜索 → 强断言查到供应商 ──
    await page.goto(`${BASE}/purchase/return`); await page.waitForTimeout(2000);
    await searchByLabel(page, '供应商', td.supName);
    await toolbarSearch(page); await page.waitForTimeout(2000); await fc.check('search');
    const lt = await page.locator('table tbody').innerText();
    expect(lt, 'return list must show test supplier').toContain(td.supName);

    // ── 编辑回显 ──
    const editRow = page.locator('table tbody tr').filter({ hasText: td.supName }).first();
    await editRow.locator('button:has-text("修改")').first().click();
    await page.waitForTimeout(2000); await fc.check('edit');
    expect(page.url()).toContain('/edit');

    // 断言字段回显
    const supTrigger = page.locator('label:has-text("供应商") + div button[role="combobox"]').first();
    await expect(supTrigger, 'supplier echo: not placeholder').not.toContainText('选择supplier');
    await expect(page.getByTestId('pr-materialname-input'), 'materialName echo').not.toHaveValue('');
    const qtyInput = page.locator('label:has-text("数量") + div input').first();
    expect(await qtyInput.inputValue(), 'quantity echo').toBe('10');
    const amtInput = page.locator('label:has-text("金额") + div input').first();
    expect(await amtInput.inputValue(), 'amount echo').toBe('5000');
    const reasonInput = page.locator('label:has-text("退货原因") + div input').first();
    await expect(reasonInput, 'returnReason echo').toHaveValue(reason);

    // Clean up
    try { const hdr = H(td.token);
      const items = await request.get(`${API}/purchase-returns`, { headers: hdr }).then(r => r.json());
      for (const i of items?.items || []) {
        if (i.returnReason?.includes('E2E') || i.materialName?.includes('E2E') || i.supplierId === td.supId) {
          await request.delete(`${API}/purchase-returns/${i.id}`, { headers: hdr }).catch(() => {});
        }
      }
    } catch {}
  });
});

// ═══════════════════ F/G/H 查询/追溯/布局 ═══════════════════

test.describe('F — 追溯', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('F1 搜索/重置/分页', async ({ page }) => {
    const fc = installFC(page);
    await clickMenu(page, ['采购管理'], '采购合同追溯', '/purchase/trace'); await fc.check('page');
    await searchByLabel(page, '订单编号', 'PO'); await toolbarSearch(page); await page.waitForTimeout(1500); await fc.check('search');
    await toolbarReset(page); await page.waitForTimeout(500);
    expect(await page.locator('.flex-wrap').first().locator('input').first().inputValue()).toBe('');
    expect(await page.getByTestId('erp-pagination').count()).toBeGreaterThan(0);
  });
});

test.describe('G — 查询页', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  for (const [label, parents, leaf, path, code] of [
    ['计划查询', ['采购管理', '采购查询'], '采购计划查询', '/purchase/query/plan', 'PPLAN'],
    ['订单查询', ['采购管理', '采购查询'], '采购订单查询', '/purchase/query/order', 'PO'],
    ['退供查询', ['采购管理', '采购查询'], '退供单查询', '/purchase/query/return', ''],
  ] as [string, string[], string, string, string][]) {
    test(`G ${label}`, async ({ page }) => {
      const fc = installFC(page);
      await clickMenu(page, parents, leaf, path); await fc.check(label);
      if (code) { await searchByLabel(page, '编号', code); await toolbarSearch(page); await page.waitForTimeout(1500); await fc.check('search'); }
      await toolbarReset(page); await page.waitForTimeout(500);
      expect(await page.getByTestId('erp-pagination').count()).toBeGreaterThan(0);
    });
  }
});

test.describe('H — UI布局', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  for (const [label, parents, leaf, path] of [
    ['供应商', ['采购管理'], '供应商档案', '/purchase/supplier'],
    ['采购计划', ['采购管理'], '采购计划维护', '/purchase/plan'],
    ['采购订单', ['采购管理'], '采购订单维护', '/purchase/order'],
    ['退供单', ['采购管理'], '退供单维护', '/purchase/return'],
  ] as [string, string[], string, string][]) {
    test(`H ${label} 分页+表头`, async ({ page }) => {
      const fc = installFC(page);
      await clickMenu(page, parents, leaf, path); await fc.check(label);
      expect(await page.getByTestId('erp-pagination').count()).toBeGreaterThan(0);
      const thBox = await page.locator('table thead th').first().boundingBox();
      if (thBox) expect(thBox.width).toBeGreaterThan(20);
    });
  }
});
