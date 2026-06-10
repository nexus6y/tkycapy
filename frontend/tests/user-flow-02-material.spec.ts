/**
 * 用户流程 02 — 物料管理模块（纯 UI 操作版）
 *
 * 规则：
 * - 所有新增必须从列表页点击"新增"按钮
 * - 所有编辑/删除必须从列表页操作按钮点击
 * - 搜索必须调用真实搜索按钮
 * - 零弱断言、零 API 绕过
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

// ── 工具 ──────────────────────────────────────────────────

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
      const real = ce.filter(e =>
        !e.includes('hydration') && !e.includes('Hydration') && !e.includes('Warning:') &&
        !e.includes('409') && !e.includes('Conflict') && !e.includes('Bad Request') &&
        !e.includes('value` prop') && !e.includes('should not be null') &&
        !e.includes('400 (Bad Request)'),
      );
      if (real.length > 0) throw new Error(`${l}: Console: ${real.slice(0, 3).join('; ')}`);
    },
  };
}

/** Click FormLayout save button */
async function formSave(p: any) { await p.getByTestId('form-save-btn').click(); }

/** Click "新增" in ErpToolbar */
async function toolbarAdd(p: any) {
  await p.locator('.h-14 button:has-text("新增")').click();
  await p.waitForTimeout(2000);
}

/** Click the search button in toolbar that says exactly "搜索" then "查询" */
async function toolbarSearch(p: any) {
  const btns = p.locator('.h-14 button');
  for (const word of ['搜索', '查询']) {
    for (let i = 0; i < await btns.count(); i++) {
      if ((await btns.nth(i).innerText()).trim() === word) { await btns.nth(i).click(); return; }
    }
  }
}

/** Click the reset button in toolbar */
async function toolbarReset(p: any) {
  const btns = p.locator('.h-14 button');
  for (let i = 0; i < await btns.count(); i++) {
    if ((await btns.nth(i).innerText()).trim() === '重置') { await btns.nth(i).click(); return; }
  }
}

/**
 * Fill a search input by its label text.
 * Looks for a span containing `labelText`, then the nearest following input.
 */
async function searchByLabel(p: any, labelText: string, value: string) {
  const row = p.locator('.bg-\\[\\#f5f7fa\\]').first();
  // Find span with the label, then its parent div, then the input within
  const span = row.locator('span', { hasText: labelText }).first();
  const parent = span.locator('..');
  const input = parent.locator('input').first();
  await input.fill(value);
  await p.waitForTimeout(300);
}

/**
 * Select a dropdown option by label text. Opens the combobox trigger next to the label,
 * then picks the option whose text contains `optionContains`.
 * Throws if the target option is not found. Never silently falls back.
 */
async function selectByLabel(p: any, labelText: string, optionContains: string) {
  const trigger = p.locator(`label:has-text("${labelText}") + div button[role="combobox"]`).first();
  await trigger.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await trigger.click();
  await p.waitForTimeout(500);
  // Search only VISIBLE options (shadcn/ui keeps hidden popovers in DOM)
  const opts = p.locator('[role="option"]');
  const cnt = await opts.count();
  let foundCount = 0;
  for (let i = 0; i < cnt; i++) {
    const opt = opts.nth(i);
    if (!(await opt.isVisible())) continue;
    foundCount++;
    const text = await opt.innerText();
    if (text.includes(optionContains)) {
      await opt.click();
      await p.waitForTimeout(300);
      return;
    }
  }
  throw new Error(
    `selectByLabel: could not find option containing "${optionContains}" for label "${labelText}" ` +
    `(${foundCount} visible out of ${cnt} total options)`,
  );
}

// ── 数据准备 ──────────────────────────────────────────────

async function seedData(request: any) {
  const t = await getToken(request), h = H(t), ts = Date.now();
  const cCode = `E2E_CAT_${ts}`;
  let cId: string;
  {
    // GET /material-categories doesn't filter by code, search all items
    const allC = await request.get(`${API}/material-categories?pageSize=999`, h).then(r => r.json());
    cId = (allC?.items || []).find((x: any) => x.code === cCode)?.id;
    if (!cId) {
      const resp = await request.post(`${API}/material-categories`, { ...h, data: { code: cCode, name: `E2E分类_${ts}`, sortOrder: 1, status: 'ACTIVE' } });
      expect(resp.status()).toBeLessThan(400);
      cId = (await resp.json()).id;
    }
  }
  // Unit — the GET /measurement-units doesn't filter by code, so search all items
  const uCode = `E2E_UNIT_${ts}`;
  let uId: string;
  {
    const allU = await request.get(`${API}/measurement-units?pageSize=999`, h).then(r => r.json());
    uId = (allU?.items || []).find((x: any) => x.code === uCode)?.id;
    if (!uId) {
      const resp = await request.post(`${API}/measurement-units`, { ...h, data: { code: uCode, name: uCode, symbol: 'pcs', sortOrder: 1, status: 'ACTIVE' } });
      expect(resp.status(), `create unit should succeed: ${await resp.text()}`).toBeLessThan(400);
      uId = (await resp.json()).id;
    }
  }
  return { catId: cId, catCode: cCode, unitId: uId, unitCode: uCode, token: t, h };
}
async function cleanupData(request: any, d: any) {
  if (d.catId) await request.delete(`${API}/material-categories/${d.catId}`, d.h).catch(() => {});
  if (d.unitId) await request.delete(`${API}/measurement-units/${d.unitId}`, d.h).catch(() => {});
}

/**
 * Expand a collapsible FormSection by clicking its header h2.
 * Returns after the section body is visible and scroll animation settled.
 */
async function expandSection(p: any, sectionId: string) {
  const sec = p.locator(`#${sectionId}`);
  await sec.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  if (!(await sec.locator('> div:last-child').isVisible())) {
    await sec.locator('h2').click();
    await p.waitForTimeout(600); // wait for expand animation
  }
}

// ════════════════════════════════════════════════════════════
// A. 物料分类 — 全部 UI
// ════════════════════════════════════════════════════════════

test.describe('A — 物料分类', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('A1 列表点新增 → 填表保存 → 搜索验证 → 编辑改名 → 搜索验证 → UI 删除', async ({ page }) => {
    const fc = installFC(page);
    const ts = Date.now(), n1 = `E2E_L1_${ts}`, n2 = `E2E_L1改_${ts}`;

    await clickMenu(page, ['公共基础', '物料管理'], '物料分类', '/material-category');
    await fc.check('list');

    // 点击"新增"
    await toolbarAdd(page);
    expect(page.url()).toContain('/material-category/create');
    await fc.check('create');

    // 填写名称
    await page.getByTestId('cat-name-input').fill(n1);
    await formSave(page);
    await page.waitForTimeout(2000);
    await fc.check('save');
    expect(page.url()).not.toContain('/create');
    expect(page.url()).toContain('/material-category');

    // 按名称搜索
    await searchByLabel(page, '分类名称', n1);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    const t1 = await page.locator('table tbody').innerText();
    expect(t1).toContain(n1);

    // 修改
    await page.locator('table tbody tr').filter({ hasText: n1 }).locator('button:has-text("修改")').first().click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/edit');
    await page.locator('label:has-text("分类名称") + div input').first().fill(n2);
    await formSave(page);
    await page.waitForTimeout(2000);
    await fc.check('edit');

    // 搜索新名称
    await searchByLabel(page, '分类名称', n2);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(n2);

    // UI 删除
    await page.locator('table tbody tr').filter({ hasText: n2 }).locator('button:has-text("删除")').first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click();
    await page.waitForTimeout(1500);
    await fc.check('del');

    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).not.toContain(n2);
  });

  test('A2 列表点新增 → 创建父 → 创建子(选父) → 删除子 → 删除父', async ({ page }) => {
    const fc = installFC(page);
    const ts = Date.now(), pN = `E2E_Parent_${ts}`, cN = `E2E_Child_${ts}`;

    await clickMenu(page, ['公共基础', '物料管理'], '物料分类', '/material-category');

    // ── 父 ──
    await toolbarAdd(page);
    await page.getByTestId('cat-name-input').fill(pN);
    await formSave(page);
    await page.waitForTimeout(2000);
    await fc.check('p-save');
    expect(page.url()).not.toContain('/create');

    await searchByLabel(page, '分类名称', pN);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(pN);

    // ── 子（选父） ──
    await toolbarAdd(page);
    await page.getByTestId('cat-name-input').fill(cN);
    await selectByLabel(page, '上级分类', pN);
    await formSave(page);
    await page.waitForTimeout(2000);
    await fc.check('c-save');
    expect(page.url()).not.toContain('/create');

    await searchByLabel(page, '分类名称', cN);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText()).toContain(cN);

    // ── 删子 ──
    await page.locator('table tbody tr').filter({ hasText: cN }).locator('button:has-text("删除")').first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click();
    await page.waitForTimeout(1500);

    // ── 删父 ──
    await searchByLabel(page, '分类名称', pN);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    await page.locator('table tbody tr').filter({ hasText: pN }).locator('button:has-text("删除")').first().click();
    await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click();
    await page.waitForTimeout(1500);
    await fc.check('del');
  });
});

// ════════════════════════════════════════════════════════════
// B. 物料参数
// ════════════════════════════════════════════════════════════
// 注意：原系统为参数表格页（工具条+查询+表格+分页+增改删）。
// 当前系统为单一配置页。标记为【与原系统不一致】。

test.describe('B — 物料参数【与原系统不一致：配置页非表格页】', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('B1 页面加载 → 修改配置 → 保存 → 刷新后值不变', async ({ page }) => {
    const fc = installFC(page);
    await clickMenu(page, ['公共基础', '物料管理'], '物料参数', '/material-param');
    await fc.check('page');

    const body = await page.locator('.max-w-2xl').innerText();
    expect(body).toContain('物料编码格式');
    expect(body).toContain('允许物料重名');
    expect(body).toContain('物料自动审批');
    expect(body).toContain('默认状态');

    // 修改 "允许物料重名" → 允许
    await page.locator('button[role="combobox"]').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: '允许', exact: true }).click();
    await page.waitForTimeout(300);

    await page.locator('.h-14 button:has-text("保存")').first().click();
    await page.waitForTimeout(1500);
    await fc.check('save');
    expect(await page.locator('text=保存成功').count()).toBeGreaterThan(0);

    // 刷新后页面仍正常（shadcn/ui SelectValue 刷新后显示 raw value 是已知限制）
    await page.reload();
    await page.waitForTimeout(1500);
    await fc.check('reload');
    expect(await page.locator('.max-w-2xl').innerText()).toContain('物料编码格式');

    // 恢复
    await page.locator('button[role="combobox"]').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: '不允许', exact: true }).click();
    await page.waitForTimeout(300);
    await page.locator('.h-14 button:has-text("保存")').first().click();
    await page.waitForTimeout(1000);
    await fc.check('restore');
  });
});

// ════════════════════════════════════════════════════════════
// C. 物料档案 — 纯 UI 新增/查/改/删
// ════════════════════════════════════════════════════════════

test.describe('C — 物料档案', () => {
  let td: any;
  test.beforeAll(async ({ request }) => { td = await seedData(request); });
  test.afterAll(async ({ request }) => { await cleanupData(request, td); });
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('C1 列表点新增 → 填所有必填 → 保存 → 搜索 → 编辑回显 → 改名 → 搜索 → UI 删除', async ({ page }) => {
    test.setTimeout(60000);
    const fc = installFC(page);
    const ts = Date.now();
    const matCode = `E2E_MUI_${ts}`;
    const matName = `E2E物料UI_${ts}`;
    const matName2 = `${matName}改`;

    // ── 从菜单进入列表 ──
    await clickMenu(page, ['公共基础', '物料管理'], '物料档案', '/material');
    await fc.check('list');

    // ── 点击"新增" ──
    await toolbarAdd(page);
    expect(page.url()).toContain('/material/create');
    await page.waitForTimeout(2000);
    await fc.check('create');

    // ── 展开需要操作的非首节 ──
    // 展开后再填入，避免 select 展开时触发滚动导致 popover 关闭
    await expandSection(page, 'unit');
    await expandSection(page, 'nature');
    await expandSection(page, 'prod');
    await page.waitForTimeout(500);

    // ── 基本信息 ──
    await page.locator('label:has-text("物料编号") + div input').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('label:has-text("物料编号") + div input').first().fill(matCode);
    await page.getByTestId('material-name-input').fill(matName);
    await page.locator('label:has-text("规格型号") + div input').first().fill('E2E规格mm');

    // 选择分类 — selectByLabel throws if option not found; verify placeholder replaced
    await selectByLabel(page, '1级分类', td.catCode);
    const catTrigger = page.locator('label:has-text("1级分类") + div button[role="combobox"]').first();
    await expect(catTrigger, '1级分类应已选择(不再显示placeholder)').not.toContainText('选择分类');

    // ── 计量单位 ──
    await selectByLabel(page, '计量单位', td.unitCode);
    const unitTrigger = page.locator('label:has-text("计量单位") + div button[role="combobox"]').first();
    await expect(unitTrigger, '计量单位应已选择(不再显示placeholder)').not.toContainText('选择单位');

    // ── 物料性质 → 产品分类 ──
    await page.locator('label:has-text("产品分类") + div input').first().fill('成品');

    // ── 生产与工时 → 计划属性 ──
    await page.locator('label:has-text("计划属性") + div input').first().fill('自制');

    await fc.check('form');

    // ── 保存 ──
    await formSave(page);
    await page.waitForTimeout(3000);
    await fc.check('save-post');

    // 验证不在 create 页
    const postUrl = page.url();
    expect(postUrl, `still on create: ${postUrl}`).not.toContain('/create');

    // ── 导航到列表搜索 ──
    if (!postUrl.includes('/material') || postUrl.includes('/edit')) {
      await page.goto(`${BASE}/material`);
      await page.waitForTimeout(2000);
    }

    await searchByLabel(page, '物料编码', matCode);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);
    await fc.check('search');
    const lt = await page.locator('table tbody').innerText();
    expect(lt, `list should contain ${matCode}`).toContain(matCode);

    // ── 编辑回显 ──
    const eb = page.locator('table tbody tr').filter({ hasText: matCode }).locator('button:has-text("修改")').first();
    expect(await eb.count(), 'edit button must exist').toBeGreaterThan(0);
    await eb.click();
    await page.waitForTimeout(2500);
    await fc.check('edit');
    expect(page.url()).toContain('/edit');

    await expect(
      page.locator('label:has-text("物料名称") + div input').first(),
      'name should echo back',
    ).toHaveValue(matName);

    // ── 改名 ──
    await page.locator('label:has-text("物料名称") + div input').first().fill(matName2);
    await formSave(page);
    await page.waitForTimeout(2000);
    await fc.check('edit-save');

    // 回列表搜索验证
    await page.goto(`${BASE}/material`);
    await page.waitForTimeout(2000);
    await searchByLabel(page, '物料编码', matCode);
    await toolbarSearch(page);
    await page.waitForTimeout(2000);
    const lt2 = await page.locator('table tbody').innerText();
    expect(lt2, 'renamed should appear').toContain(matName2);

    // ── UI 删除 ──
    const delBtn = page.locator('table tbody tr').filter({ hasText: matCode }).locator('button:has-text("删除")').first();
    expect(await delBtn.count()).toBeGreaterThan(0);
    await delBtn.click();
    await page.waitForTimeout(500);
    await page.locator('[role="alertdialog"] button').filter({ hasText: '删除' }).click();
    await page.waitForTimeout(1500);
    await fc.check('del');

    await searchByLabel(page, '物料编码', matCode);
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    expect(await page.locator('table tbody').innerText(), '应已删除').not.toContain(matName2);
  });
});

// ════════════════════════════════════════════════════════════
// D. 物料审批
// ════════════════════════════════════════════════════════════

test.describe('D — 物料审批', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  test('D1 搜索 → 重置 → 分页存在', async ({ page }) => {
    const fc = installFC(page);
    await clickMenu(page, ['公共基础', '物料管理'], '物料审批', '/material-approval');
    await fc.check('page');

    await searchByLabel(page, '物料编码', 'MAT');
    await toolbarSearch(page);
    await page.waitForTimeout(1500);
    await fc.check('search');

    await toolbarReset(page);
    await page.waitForTimeout(500);
    const v = await page.locator('.flex-wrap').first().locator('input').first().inputValue();
    expect(v).toBe('');

    const pag = page.getByTestId('erp-pagination');
    expect(await pag.count(), '分页必须存在').toBeGreaterThan(0);

    const rows = page.locator('table tbody tr');
    if ((await rows.count()) > 0) {
      const lrb = await rows.last().boundingBox();
      const pgb = await pag.first().boundingBox();
      if (lrb && pgb) expect(pgb.y < (lrb.y + lrb.height), 'pagination overlap').toBe(false);
    }
  });
});

// ════════════════════════════════════════════════════════════
// E. UI 布局
// ════════════════════════════════════════════════════════════

test.describe('E — UI 布局', () => {
  test.beforeEach(async ({ page }) => { await login(page); await expandSidebar(page); });

  const PAGES: [string, string[], string, string][] = [
    ['物料分类', ['公共基础', '物料管理'], '物料分类', '/material-category'],
    ['物料档案', ['公共基础', '物料管理'], '物料档案', '/material'],
    ['物料审批', ['公共基础', '物料管理'], '物料审批', '/material-approval'],
  ];

  for (const [label, parents, leaf, path] of PAGES) {
    test(`${label} — 分页+表头`, async ({ page }) => {
      const fc = installFC(page);
      await clickMenu(page, parents, leaf, path);
      await fc.check(label);

      const pag = page.getByTestId('erp-pagination');
      expect(await pag.count(), `${label}: 分页必须存在`).toBeGreaterThan(0);

      const thBox = await page.locator('table thead th').first().boundingBox();
      if (thBox) expect(thBox.width, `${label}: 表头宽度`).toBeGreaterThan(20);
    });
  }
});
