/**
 * 用户流程 09 — 基础资料 + 仓储基础实体收尾 (纯 UI 版)
 *
 * 零 API fallback。所有 create/edit 必须通过 UI 完成。
 * API 仅用于 seed 基础数据 + 最终核验。
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
async function formSave(p: any) { await p.locator('button[data-testid="form-save-btn"]').first().click({ force: true }); }
async function toolbarSearch(p: any) {
  for (const w of ['搜索','查询']) { const b = p.locator('.h-14 button'); for (let i = 0; i < await b.count(); i++) { if ((await b.nth(i).innerText()).trim() === w) { await b.nth(i).click(); return; } } }
}
function H(t: string) { return { headers: { Authorization: `Bearer ${t}` } }; }
async function getToken(r: any) { return (await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token; }

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
  return { catId, uId, token: t, h };
}
async function rollbackAll(request: any, token: string) {
  const h = H(token);
  for (const api of ['locations','shelves','passages','zones','warehouses','materials','material-categories','measurement-units','projects','customers','suppliers']) {
    const r = await request.get(`${API}/${api}?pageSize=200`, h).then((r: any) => r.json());
    for (const o of r?.items || []) {
      if ((o.code || o.name || '')?.includes('E2E')) {
        await request.delete(`${API}/${api}/${o.id}`, h).catch(() => {});
      }
    }
  }
}

// ═══════════════════ A. 物料分类 ═══════════════════
test.describe('A — 物料分类', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('A1 UI create：填名称→保存→搜索→编辑改名→API核验', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), name = `E2E分类_${ts}`;
    await page.goto(`${BASE}/material-category/create`); await page.waitForTimeout(2000);
    await page.locator('label:has-text("名称") + div input').first().fill(name);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'A1 UI save must redirect from create').not.toContain('/create');

    // Find via API to get id
    const resp = await request.get(`${API}/material-categories?pageSize=999`, hdr).then((r: any) => r.json());
    const c = (resp.items || []).find((x: any) => x.name === name);
    expect(c, 'A1 created record must exist').toBeTruthy();
    const code = c.code;
    console.log(`A1: create = ${code}`);

    // UI edit → change name
    await page.goto(`${BASE}/material-category/${c.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url(), 'A1 edit page loads').toContain('/edit');
    expect(await page.locator('label:has-text("名称") + div input').first().inputValue()).toBe(name);
    const n2 = `${name}_改`;
    await page.locator('label:has-text("名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v2 = await request.get(`${API}/material-categories/${c.id}`, hdr).then((r: any) => r.json());
    expect(v2.name, 'A1 edit must persist name change').toBe(n2);
    console.log(`A1: ${code} → ${n2} ✅`);
  });
});

// ═══════════════════ B. 物料档案 ═══════════════════
test.describe('B — 物料档案', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('B1 UI create→选分类/单位→填名/规格/计划属性→保存→编辑→API核验', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), name = `E2E物料_${ts}`;
    await page.goto(`${BASE}/material/create`); await page.waitForTimeout(2000); await fc.check('b1c');

    // ── Section "basic" (active by default) ──
    await page.locator('label:has-text("物料名称") + div input').first().fill(name);
    await page.locator('label:has-text("规格型号") + div input').first().fill('E2E规格mm');

    // Select 1级分类 via EntitySelect
    const catCb = page.locator('label:has-text("1级分类") + div button[role="combobox"]').first();
    await catCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes('E2E')) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);

    // ── Navigate to "物料性质" section → fill productCategory ──
    const natureAnchor = page.locator('a:has-text("物料性质")');
    if (await natureAnchor.count() > 0) await natureAnchor.first().click();
    await page.waitForTimeout(500);
    await page.locator('label:has-text("产品分类") + div input').first().fill('成品');
    await page.waitForTimeout(300);

    // ── Navigate to "计量单位" section → select unit ──
    const unitAnchor = page.locator('a:has-text("计量单位")');
    if (await unitAnchor.count() > 0) await unitAnchor.first().click();
    await page.waitForTimeout(500);
    const unitCb = page.locator('label:has-text("计量单位") + div button[role="combobox"]').first();
    await unitCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes('E2E')) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);

    // ── Navigate to "生产与工时" section → fill planAttribute ──
    const prodAnchor = page.locator('a:has-text("生产")');
    if (await prodAnchor.count() > 0) await prodAnchor.first().click();
    await page.waitForTimeout(500);
    await page.locator('label:has-text("计划属性") + div input').first().fill('自制');
    await page.waitForTimeout(500);

    // ── Click save ──
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 15000 }); } catch {}
    expect(page.url(), 'B1 UI save must redirect').not.toContain('/create');

    // Find via API
    const resp = await request.get(`${API}/materials?pageSize=999`, hdr).then((r: any) => r.json());
    const m = (resp.items || []).find((x: any) => x.name === name);
    expect(m, 'B1 created material must exist').toBeTruthy();
    const code = m.code;
    console.log(`B1: create = ${code}`);
    // Verify key API fields
    const detail = await request.get(`${API}/materials/${m.id}`, hdr).then((r: any) => r.json());
    expect(detail.specification, 'B1 spec stored').toBe('E2E规格mm');
    expect(detail.productCategory, 'B1 productCategory stored').toBe('成品');
    expect(detail.planAttribute, 'B1 planAttribute stored').toBe('自制');

    // UI edit → change name
    await page.goto(`${BASE}/material/${m.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("物料名称") + div input').first().inputValue()).toBe(name);
    const n2 = `${name}_改`;
    await page.locator('label:has-text("物料名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/materials/${m.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'B1 edit must persist name change').toBe(n2);
    console.log(`B1: ${code} → ${n2} ✅`);
  });
});

// ═══════════════════ C. 客户 ═══════════════════
test.describe('C — 客户', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('C1 UI create+edit：自动编码→填名/联系人→保存→编辑改名', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), name = `E2E客户_${ts}`;
    await page.goto(`${BASE}/sales/customer/create`); await page.waitForTimeout(2000);
    const code = await page.locator('label:has-text("客户编码") + div input').first().inputValue();
    expect(code.startsWith('CUS'), 'C1 auto code').toBeTruthy();
    await page.locator('label:has-text("客户名称") + div input').first().fill(name);
    await page.locator('label:has-text("联系人") + div input').first().fill('E2E张先生');
    await page.locator('label:has-text("联系电话") + div input').first().fill('13912345678');
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'C1 save redirect').not.toContain('/create');

    const v1 = await request.get(`${API}/customers?code=${encodeURIComponent(code)}`, hdr).then((r: any) => r.json());
    const c = v1.items?.[0];
    expect(c?.name, 'C1 name stored').toBe(name);
    expect(c?.contactPerson, 'C1 contactPerson stored').toBe('E2E张先生');
    console.log(`C1: ${code} contact=${c?.contactPerson} ✅`);

    await page.goto(`${BASE}/sales/customer/${c.id}/edit`); await page.waitForTimeout(2000);
    expect(await page.locator('label:has-text("客户名称") + div input').first().inputValue()).toBe(name);
    const n2 = `${name}_改`;
    await page.locator('label:has-text("客户名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/customers/${c.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'C1 name changed').toBe(n2);
    console.log(`C1: ${code} → ${n2} ✅`);
  });
});

// ═══════════════════ D. 供应商 ═══════════════════
test.describe('D — 供应商', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('D1 UI create+edit：自动编码→填名/联系人/税号→保存→编辑改名', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), name = `E2E供应商_${ts}`;
    await page.goto(`${BASE}/purchase/supplier/create`); await page.waitForTimeout(2000);
    const code = await page.locator('label:has-text("供应商编码") + div input').first().inputValue();
    expect(code.startsWith('SUP'), 'D1 auto code').toBeTruthy();
    console.log(`D1: code = ${code}`);
    await page.locator('label:has-text("供应商名称") + div input').first().fill(name);
    await page.locator('label:has-text("联系人") + div input').first().fill('E2E李先生');
    await page.locator('label:has-text("联系电话") + div input').first().fill('13712345678');
    await page.locator('label:has-text("税号") + div input').first().fill('E2E12345678');
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'D1 save redirect').not.toContain('/create');

    const v1 = await request.get(`${API}/suppliers?code=${encodeURIComponent(code)}`, hdr).then((r: any) => r.json());
    const s = v1.items?.[0];
    expect(s?.name, 'D1 name stored').toBe(name);
    expect(s?.taxId, 'D1 taxId stored').toBe('E2E12345678');
    console.log(`D1: ${code} taxId=${s?.taxId} ✅`);

    await page.goto(`${BASE}/purchase/supplier/${s.id}/edit`); await page.waitForTimeout(2000);
    expect(await page.locator('label:has-text("供应商名称") + div input').first().inputValue()).toBe(name);
    const n2 = `${name}_改`;
    await page.locator('label:has-text("供应商名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/suppliers/${s.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'D1 name changed').toBe(n2);
    console.log(`D1: ${code} → ${n2} ✅`);
  });
});

// ═══════════════════ E. 项目 ═══════════════════
test.describe('E — 项目', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  test('E1 UI create+edit：自动编码→填名/来源→保存→编辑改名', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), name = `E2E项目_${ts}`;
    await page.goto(`${BASE}/project/create`); await page.waitForTimeout(2000);
    const code = await page.locator('label:has-text("项目编码") + div input').first().inputValue();
    console.log(`E1: code = ${code}`);
    await page.locator('label:has-text("项目名称") + div input').first().fill(name);
    await page.locator('label:has-text("项目来源") + div input').first().fill('E2E内部');
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'E1 save redirect').not.toContain('/create');

    const v1 = await request.get(`${API}/projects?code=${encodeURIComponent(code)}`, hdr).then((r: any) => r.json());
    const p = v1.items?.[0];
    expect(p?.name, 'E1 name stored').toBe(name);
    expect(p?.source, 'E1 source stored').toBe('E2E内部');
    console.log(`E1: ${code} source=${p?.source} ✅`);

    await page.goto(`${BASE}/project/${p.id}/edit`); await page.waitForTimeout(2000);
    expect(await page.locator('label:has-text("项目名称") + div input').first().inputValue()).toBe(name);
    const n2 = `${name}_改`;
    await page.locator('label:has-text("项目名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/projects/${p.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'E1 name changed').toBe(n2);
    console.log(`E1: ${code} → ${n2} ✅`);
  });
});

// ═══════════════════ F. 仓储层级链 ═══════════════════
test.describe('F — 仓储层级链', () => {
  let td: any; test.beforeAll(async ({ request }) => { td = await seedData(request); }); test.afterAll(async ({ request }) => { await rollbackAll(request, td.token); }); test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('F1 仓库 UI create+edit', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), whName = `E2E仓库_${ts}`;
    await page.goto(`${BASE}/warehouse/warehouse/create`); await page.waitForTimeout(2000);
    const whCode = await page.locator('label:has-text("仓库编码") + div input').first().inputValue();
    await page.locator('label:has-text("仓库名称") + div input').first().fill(whName);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'F1 save redirect').not.toContain('/create');
    const w = await request.get(`${API}/warehouses?code=${encodeURIComponent(whCode)}`, hdr).then((r: any) => r.json());
    const wh = w.items?.[0]; expect(wh?.name, 'F1 created').toBe(whName);
    // Edit
    await page.goto(`${BASE}/warehouse/warehouse/${wh.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("仓库编码") + div input').first().inputValue()).toBe(whCode);
    expect(await page.locator('label:has-text("仓库名称") + div input').first().inputValue()).toBe(whName);
    const n2 = `${whName}_改`;
    await page.locator('label:has-text("仓库名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/warehouses/${wh.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'F1 edit persisted').toBe(n2);
    (test as any)._whId = wh.id; (test as any)._whCode = whCode; (test as any)._whName = whName;
    console.log(`F1: warehouse ${whCode} create+edit ✅`);
  });

  test('F2 地区/区域 UI create+edit', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), aName = `E2E地区_${ts}`;
    // Area pages reuse /warehouses backend
    await page.goto(`${BASE}/warehouse/area/create`); await page.waitForTimeout(2000);
    const aCode = await page.locator('label:has-text("地区编码") + div input').first().inputValue();
    await page.locator('label:has-text("地区名称") + div input').first().fill(aName);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'F2 save redirect').not.toContain('/create');
    const aResp = await request.get(`${API}/warehouses?code=${encodeURIComponent(aCode)}`, hdr).then((r: any) => r.json());
    const a = aResp.items?.[0]; expect(a?.name, 'F2 created').toBe(aName);
    // Edit
    await page.goto(`${BASE}/warehouse/area/${a.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("地区编码") + div input').first().inputValue()).toBe(aCode);
    expect(await page.locator('label:has-text("地区名称") + div input').first().inputValue()).toBe(aName);
    const n2 = `${aName}_改`;
    await page.locator('label:has-text("地区名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/warehouses/${a.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'F2 edit persisted').toBe(n2);
    console.log(`F2: area ${aCode} create+edit ✅`);
  });

  test('F3 储区 UI create+edit (选仓库)', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), zName = `E2E储区_${ts}`;
    const whId = (test as any)._whId; const whName = (test as any)._whName;
    await page.goto(`${BASE}/warehouse/zone/create`); await page.waitForTimeout(2000);
    const zCode = await page.locator('label:has-text("储区编码") + div input').first().inputValue();
    await page.locator('label:has-text("储区名称") + div input').first().fill(zName);
    const whCb = page.locator('label:has-text("所属仓库") + div button[role="combobox"]').first();
    await whCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes(whName)) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'F3 save redirect').not.toContain('/create');
    const zResp = await request.get(`${API}/zones?pageSize=999`, hdr).then((r: any) => r.json());
    const z = (zResp.items || []).find((x: any) => x.code === zCode);
    expect(z?.warehouseId, 'F3 linked to wh').toBe(whId);
    // Edit
    await page.goto(`${BASE}/warehouse/zone/${z.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("储区编码") + div input').first().inputValue()).toBe(zCode);
    expect(await page.locator('label:has-text("储区名称") + div input').first().inputValue()).toBe(zName);
    const n2 = `${zName}_改`;
    await page.locator('label:has-text("储区名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/zones/${z.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'F3 edit persisted').toBe(n2);
    (test as any)._zId = z.id; (test as any)._zCode = zCode; (test as any)._zName = zName;
    console.log(`F3: zone ${zCode} create+edit ✅`);
  });

  test('F4 通道 UI create+edit (选储区)', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), pName = `E2E通道_${ts}`;
    const zId = (test as any)._zId; const zName = (test as any)._zName;
    await page.goto(`${BASE}/warehouse/passage/create`); await page.waitForTimeout(2000);
    const pCode = await page.locator('label:has-text("通道编码") + div input').first().inputValue();
    await page.locator('label:has-text("通道名称") + div input').first().fill(pName);
    const zCb = page.locator('label:has-text("所属储区") + div button[role="combobox"]').first();
    await zCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes(zName)) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'F4 save redirect').not.toContain('/create');
    const pResp = await request.get(`${API}/passages?pageSize=999`, hdr).then((r: any) => r.json());
    const pa = (pResp.items || []).find((x: any) => x.code === pCode);
    expect(pa?.zoneId, 'F4 linked to zone').toBe(zId);
    // Edit
    await page.goto(`${BASE}/warehouse/passage/${pa.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("通道编码") + div input').first().inputValue()).toBe(pCode);
    expect(await page.locator('label:has-text("通道名称") + div input').first().inputValue()).toBe(pName);
    const n2 = `${pName}_改`;
    await page.locator('label:has-text("通道名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/passages/${pa.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'F4 edit persisted').toBe(n2);
    (test as any)._pId = pa.id; (test as any)._pCode = pCode; (test as any)._pName = pName;
    console.log(`F4: passage ${pCode} create+edit ✅`);
  });

  test('F5 货架 UI create+edit (选通道)', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), sName = `E2E货架_${ts}`;
    const pId = (test as any)._pId; const pName = (test as any)._pName;
    await page.goto(`${BASE}/warehouse/shelf/create`); await page.waitForTimeout(2000);
    const sCode = await page.locator('label:has-text("货架编码") + div input').first().inputValue();
    await page.locator('label:has-text("货架名称") + div input').first().fill(sName);
    const pCb = page.locator('label:has-text("所属通道") + div button[role="combobox"]').first();
    await pCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes(pName)) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'F5 save redirect').not.toContain('/create');
    const sResp = await request.get(`${API}/shelves?pageSize=999`, hdr).then((r: any) => r.json());
    const sh = (sResp.items || []).find((x: any) => x.code === sCode);
    expect(sh?.passageId, 'F5 linked to passage').toBe(pId);
    // Edit
    await page.goto(`${BASE}/warehouse/shelf/${sh.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("货架编码") + div input').first().inputValue()).toBe(sCode);
    expect(await page.locator('label:has-text("货架名称") + div input').first().inputValue()).toBe(sName);
    const n2 = `${sName}_改`;
    await page.locator('label:has-text("货架名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/shelves/${sh.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'F5 edit persisted').toBe(n2);
    (test as any)._sId = sh.id; (test as any)._sCode = sCode; (test as any)._sName = sName;
    console.log(`F5: shelf ${sCode} create+edit ✅`);
  });

  test('F6 货位 UI create+edit (选货架)', async ({ page, request }) => {
    const fc = installFC(page); const hdr = H(td.token); const ts = Date.now(), lName = `E2E货位_${ts}`;
    const sId = (test as any)._sId; const sName = (test as any)._sName;
    await page.goto(`${BASE}/warehouse/location/create`); await page.waitForTimeout(2000);
    const lCode = await page.locator('label:has-text("货位编码") + div input').first().inputValue();
    await page.locator('label:has-text("货位名称") + div input').first().fill(lName);
    await page.locator('label:has-text("层") + div input').first().fill('A');
    await page.locator('label:has-text("列") + div input').first().fill('01');
    const sCb = page.locator('label:has-text("所属货架") + div button[role="combobox"]').first();
    await sCb.click(); await page.waitForTimeout(800);
    for (let i = 0; i < await page.locator('[role="option"]').count(); i++) {
      if (!(await page.locator('[role="option"]').nth(i).isVisible())) continue;
      if ((await page.locator('[role="option"]').nth(i).innerText()).includes(sName)) { await page.locator('[role="option"]').nth(i).click(); break; }
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/create'), { timeout: 10000 }); } catch {}
    expect(page.url(), 'F6 save redirect').not.toContain('/create');
    const lResp = await request.get(`${API}/locations?pageSize=999`, hdr).then((r: any) => r.json());
    const lo = (lResp.items || []).find((x: any) => x.code === lCode);
    expect(lo?.shelfId, 'F6 linked to shelf').toBe(sId);
    expect(lo?.layer, 'F6 layer').toBe('A');
    expect(lo?.col, 'F6 col').toBe('01');
    // Edit
    await page.goto(`${BASE}/warehouse/location/${lo.id}/edit`); await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    expect(await page.locator('label:has-text("货位编码") + div input').first().inputValue()).toBe(lCode);
    expect(await page.locator('label:has-text("货位名称") + div input').first().inputValue()).toBe(lName);
    const n2 = `${lName}_改`;
    await page.locator('label:has-text("货位名称") + div input').first().fill(n2);
    await formSave(page);
    try { await page.waitForURL((u: any) => !u.pathname.includes('/edit'), { timeout: 10000 }); } catch {}
    const v = await request.get(`${API}/locations/${lo.id}`, hdr).then((r: any) => r.json());
    expect(v.name, 'F6 edit persisted').toBe(n2);
    (test as any)._lId = lo.id; (test as any)._lCode = lCode; (test as any)._lName = lName;
    console.log(`F6: location ${lCode} create+edit ✅`);
  });

  test('F7 仓储层级链全链路 API 核验', async ({ request }) => {
    const hdr = H(td.token);
    const whId = (test as any)._whId, whCode = (test as any)._whCode;
    const zId = (test as any)._zId, zCode = (test as any)._zCode;
    const pId = (test as any)._pId, pCode = (test as any)._pCode;
    const sId = (test as any)._sId, sCode = (test as any)._sCode;
    const lId = (test as any)._lId, lCode = (test as any)._lCode;
    const wh = await request.get(`${API}/warehouses/${whId}`, hdr).then((r: any) => r.json());
    const z = await request.get(`${API}/zones/${zId}`, hdr).then((r: any) => r.json());
    const p = await request.get(`${API}/passages/${pId}`, hdr).then((r: any) => r.json());
    const s = await request.get(`${API}/shelves/${sId}`, hdr).then((r: any) => r.json());
    const l = await request.get(`${API}/locations/${lId}`, hdr).then((r: any) => r.json());
    expect(wh.code).toBe(whCode); expect(z.warehouseId).toBe(whId);
    expect(p.zoneId).toBe(zId); expect(s.passageId).toBe(pId);
    expect(l.shelfId).toBe(sId);
    console.log(`F7: chain ${whCode}→${zCode}→${pCode}→${sCode}→${lCode} ✅`);
  });
});

// ═══════════════════ G. 布局 ═══════════════════
test.describe('G — 布局', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });
  for (const [label, url] of [
    ['物料分类', '/material-category'], ['物料档案', '/material'],
    ['客户', '/sales/customer'], ['供应商', '/purchase/supplier'],
    ['项目', '/project'], ['仓库', '/warehouse/warehouse'],
    ['地区', '/warehouse/area'], ['储区', '/warehouse/zone'],
    ['通道', '/warehouse/passage'], ['货架', '/warehouse/shelf'],
    ['货位', '/warehouse/location'],
  ] as [string, string][]) {
    test(`G-${label} 分页+表头+无404`, async ({ page }) => {
      const fc = installFC(page); await page.goto(`${BASE}${url}`); await page.waitForTimeout(1500); await fc.check(label);
      expect(page.url(), `${label} not 404`).not.toContain('/_not-found');
      expect(await page.locator('table').count(), `${label}: table`).toBeGreaterThan(0);
      expect(await page.getByTestId('erp-pagination').count(), `${label}: pagination`).toBeGreaterThan(0);
    });
  }
});
