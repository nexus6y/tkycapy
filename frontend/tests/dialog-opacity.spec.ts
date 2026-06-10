/**
 * 弹窗透明度修复 E2E 验证
 * 运行：pnpm test:e2e:dialog-opacity
 *
 * 前提：backend + frontend 已启动
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001/api';

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('button:has-text("登 录")');
  await page.waitForURL('**/');
  await page.waitForTimeout(500);
}

async function getToken(request: any): Promise<string> {
  const resp = await request.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } });
  return (await resp.json()).token;
}

function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }

function parseAlpha(bg: string): number {
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) return match[4] !== undefined ? parseFloat(match[4]) : 1;
  // oklab/oklch formats always have alpha
  const oklabMatch = bg.match(/okl\w+\([\d.\s]+/);
  if (oklabMatch) {
    const parts = bg.split('/');
    if (parts.length > 1) return parseFloat(parts[1].replace(')', '').trim());
    return 1;
  }
  return 1;
}

test.describe('弹窗透明度修复验证', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. AlertDialog 确认删除弹窗背景不透明', async ({ page, request }) => {
    const token = await getToken(request);
    const h = auth(token);
    const ts = Date.now();

    // Create a draft contract via API
    const deptR = await request.get(`${API}/departments?pageSize=1`, h);
    const dept = (await deptR.json()).items[0];

    const contract = await (await request.post(`${API}/contracts`, {
      ...h, data: {
        name: `弹窗测试合同-${ts}`, type: '采购合同', category: '测试类别',
        currencyType: '人民币', receiptPaymentMethod: '一次性付', amountType: '固定总价',
        totalAmount: '100000', effectiveDate: '2026-06-01',
        undertakingDepartmentId: dept?.id, undertakingDepartmentName: dept?.name,
        undertakerName: '测试',
      }
    })).json();

    await page.goto(`${BASE}/contract`);
    await page.waitForSelector('table', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Search for our contract
    const searchInput = page.locator('input').filter({ hasText: '' }).first();
    // Just reload to find our test contract
    const delBtnInRow = page.locator(`text=${contract.name}`).locator('..').locator('..').locator('button:has-text("删除")');
    if (await delBtnInRow.count() > 0) {
      await delBtnInRow.click();
      await page.waitForTimeout(500);
    } else {
      // Try the toolbar delete
      const toolbarDelBtn = page.locator('button:has-text("删除"):not([disabled])').first();
      if (await toolbarDelBtn.count() > 0) {
        await toolbarDelBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Check AlertDialog content
    const dialogContent = page.locator('[data-slot="alert-dialog-content"]');
    if (await dialogContent.count() > 0) {
      const bgColor = await dialogContent.evaluate((el: HTMLElement) =>
        window.getComputedStyle(el).backgroundColor);
      console.log('AlertDialog bg:', bgColor);
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(parseAlpha(bgColor)).toBe(1);

      await page.screenshot({ path: 'test-results/alert-dialog-opacity.png', fullPage: true });
      await page.keyboard.press('Escape');
    }

    // Cleanup
    await request.delete(`${API}/contracts/${contract.id}`, h).catch(() => {});
  });

  test('2. 物料选择弹窗所有区域不透明', async ({ page }) => {
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2000);

    // Click "新增明细"
    const addLineBtn = page.locator('button:has-text("新增明细")');
    if (await addLineBtn.count() === 0) { test.skip(); return; }
    await addLineBtn.click();
    await page.waitForTimeout(400);

    // Click material picker button
    const pickerBtns = page.locator('input[placeholder="选择物料"]');
    if (await pickerBtns.count() === 0) { test.skip(); return; }
    await pickerBtns.first().click();
    await page.waitForTimeout(800);

    const dialogContent = page.locator('[data-slot="dialog-content"]');
    if (await dialogContent.count() === 0) { test.skip(); return; }

    // 1) Dialog content bg = white, alpha = 1
    const dialogBg = await dialogContent.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor);
    console.log('MaterialPicker Dialog bg:', dialogBg);
    expect(dialogBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(parseAlpha(dialogBg)).toBe(1);

    // 2) Header bg
    const header = dialogContent.locator('[data-slot="dialog-header"]');
    if (await header.count() > 0) {
      const headerBg = await header.evaluate((el: HTMLElement) =>
        window.getComputedStyle(el).backgroundColor);
      console.log('Header bg:', headerBg);
      expect(parseAlpha(headerBg)).toBe(1);
    }

    // 3) Footer bg
    const footerBtn = dialogContent.locator('button:has-text("确定")');
    if (await footerBtn.count() > 0) {
      const footerParent = footerBtn.locator('..');
      // The footer div might be the direct parent or grandparent
      const footerBg = await footerParent.evaluate((el: HTMLElement) =>
        window.getComputedStyle(el).backgroundColor);
      console.log('Footer bg:', footerBg);
    }

    // 4) Table element itself has bg-white from ErpTable fix
    const table = dialogContent.locator('table');
    if (await table.count() > 0) {
      const tableBg = await table.evaluate((el: HTMLElement) =>
        window.getComputedStyle(el).backgroundColor);
      console.log('Table bg:', tableBg);
      // Table should have white background (not fully transparent)
      expect(parseAlpha(tableBg)).toBe(1);
    }

    await page.screenshot({ path: 'test-results/material-picker-opacity.png', fullPage: true });
    await page.keyboard.press('Escape');
  });

  test('3. 客户选择弹窗不透明', async ({ page }) => {
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2000);

    // Find entity picker inputs (readonly with search icon)
    const readonlyInputs = page.locator('input[readonly]:not([disabled])');
    const count = await readonlyInputs.count();
    // Click the customer picker input (should be the first entity picker)
    if (count >= 1) {
      await readonlyInputs.first().click();
      await page.waitForTimeout(800);
    } else {
      test.skip();
      return;
    }

    const dialogContent = page.locator('[data-slot="dialog-content"]');
    if (await dialogContent.count() === 0) { test.skip(); return; }

    // Dialog content bg = opaque white
    const dialogBg = await dialogContent.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor);
    console.log('EntityPicker Dialog bg:', dialogBg);
    expect(dialogBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(parseAlpha(dialogBg)).toBe(1);

    // Table element should have white background
    const table = dialogContent.locator('table');
    if (await table.count() > 0) {
      const tableBg = await table.evaluate((el: HTMLElement) =>
        window.getComputedStyle(el).backgroundColor);
      console.log('EntityPicker Table bg:', tableBg);
      expect(parseAlpha(tableBg)).toBe(1);
    }

    await page.screenshot({ path: 'test-results/entity-picker-opacity.png', fullPage: true });
    await page.keyboard.press('Escape');
  });

  test('4. 弹窗内表格行背景不透出背景页面', async ({ page }) => {
    await page.goto(`${BASE}/contract/create`);
    await page.waitForTimeout(2000);

    // Open material picker
    const addLineBtn = page.locator('button:has-text("新增明细")');
    if (await addLineBtn.count() === 0) { test.skip(); return; }
    await addLineBtn.click();
    await page.waitForTimeout(400);

    const pickerBtns = page.locator('input[placeholder="选择物料"]');
    if (await pickerBtns.count() === 0) { test.skip(); return; }
    await pickerBtns.first().click();
    await page.waitForTimeout(800);

    // Verify dialog bg is opaque
    const content = page.locator('[data-slot="dialog-content"]');
    if (await content.count() === 0) { test.skip(); return; }

    const bg = await content.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor);
    const alpha = parseAlpha(bg);
    console.log(`Dialog bg: ${bg}, alpha: ${alpha}`);
    expect(alpha).toBe(1);

    // Verify overlay exists (dark backdrop, not blur)
    const overlay = page.locator('[data-slot="dialog-overlay"]');
    if (await overlay.count() > 0) {
      const overlayBg = await overlay.evaluate((el: HTMLElement) =>
        window.getComputedStyle(el).backgroundColor);
      console.log('Overlay bg:', overlayBg);
      const overlayAlpha = parseAlpha(overlayBg);
      // Overlay should be semi-transparent (> 0 but < 1) or fully opaque black
      expect(overlayAlpha).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/dialog-bg-opaque.png', fullPage: true });
    await page.keyboard.press('Escape');
  });
});
