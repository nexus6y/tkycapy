/**
 * 物料分类表单保存 E2E
 * 运行：pnpm test:e2e:material-category
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

test.describe('物料分类保存契约', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('1. 新增顶级分类 parentId=无 → 保存成功 + API验证parentId=null', async ({ page, request }) => {
    const token = await getToken(request); const h = auth(token);
    const ts = Date.now(); const code = `TOP-${ts}`;

    const resp = await request.post(`${API}/material-categories`, {
      ...h, data: { code, name: `顶级分类-${ts}`, parentId: 'NONE', sortOrder: 1, status: 'ACTIVE' }
    });
    expect(resp.status()).toBeLessThan(400);
    const cat = await resp.json();
    expect(cat.id).toBeTruthy();
    expect(cat.parentId).toBeFalsy(); // must be null after normalize

    // Verify via GET
    const detail = await request.get(`${API}/material-categories/${cat.id}`, h);
    expect((await detail.json()).parentId).toBeFalsy();

    await request.delete(`${API}/material-categories/${cat.id}`, h).catch(() => {});
  });

  test('2. 新增子分类 parentId=父级 → 保存后API查询parentId=父级id', async ({ request }) => {
    const token = await getToken(request); const h = auth(token);
    const ts = Date.now();
    const parent = await (await request.post(`${API}/material-categories`, {
      ...h, data: { code: `P-${ts}`, name: `父级-${ts}`, sortOrder: 1, status: 'ACTIVE' }
    })).json();

    const child = await request.post(`${API}/material-categories`, {
      ...h, data: { code: `C-${ts}`, name: `子级-${ts}`, parentId: parent.id, sortOrder: 2, status: 'ACTIVE' }
    });
    expect(child.status()).toBeLessThan(400);
    const childData = await child.json();
    expect(childData.parentId).toBe(parent.id);

    // Cleanup
    await request.delete(`${API}/material-categories/${childData.id}`, h).catch(() => {});
    await request.delete(`${API}/material-categories/${parent.id}`, h).catch(() => {});
  });

  test('3. 重复编码 → 返回400明确提示', async ({ page, request }) => {
    const token = await getToken(request); const h = auth(token);
    const ts = Date.now();

    // Create first category
    await request.post(`${API}/material-categories`, {
      ...h, data: { code: `DUP-${ts}`, name: `重复测试-${ts}`, sortOrder: 1, status: 'ACTIVE' }
    });

    // Try duplicate via API
    const dup = await request.post(`${API}/material-categories`, {
      ...h, data: { code: `DUP-${ts}`, name: `重复测试2-${ts}`, sortOrder: 1, status: 'ACTIVE' }
    });
    expect(dup.status()).toBeGreaterThanOrEqual(400);
    const body = await dup.json();
    expect(body.message).toContain('已存在');
  });

  test('4. 无效parentId → 返回400上级分类不存在', async ({ request }) => {
    const token = await getToken(request); const h = auth(token);
    const ts = Date.now();

    const resp = await request.post(`${API}/material-categories`, {
      ...h, data: { code: `INV-${ts}`, name: `无效父级-${ts}`, parentId: 'this-id-does-not-exist', sortOrder: 1, status: 'ACTIVE' }
    });
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    const body = await resp.json();
    expect(body.message).toMatch(/上级分类|不存在/);
  });

  test('5. 编辑时parentId=self → 返回400', async ({ request }) => {
    const token = await getToken(request); const h = auth(token);
    const ts = Date.now();

    const cat = await (await request.post(`${API}/material-categories`, {
      ...h, data: { code: `SELF-${ts}`, name: `自引用-${ts}`, sortOrder: 1, status: 'ACTIVE' }
    })).json();

    const resp = await request.put(`${API}/material-categories/${cat.id}`, {
      ...h, data: { parentId: cat.id }
    });
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    const body = await resp.json();
    expect(body.message).toMatch(/自身|自引用|不能/);
    await request.delete(`${API}/material-categories/${cat.id}`, h).catch(() => {});
  });

  test('6. 编辑时parentId=自己的子孙节点 → 返回400', async ({ request }) => {
    const token = await getToken(request); const h = auth(token);
    const ts = Date.now();

    // Create parent → child → grandchild chain
    const grandparent = await (await request.post(`${API}/material-categories`, {
      ...h, data: { code: `GP-${ts}`, name: `祖父-${ts}`, sortOrder: 1, status: 'ACTIVE' }
    })).json();
    const parent = await (await request.post(`${API}/material-categories`, {
      ...h, data: { code: `PP-${ts}`, name: `父-${ts}`, parentId: grandparent.id, sortOrder: 2, status: 'ACTIVE' }
    })).json();
    const child = await (await request.post(`${API}/material-categories`, {
      ...h, data: { code: `CC-${ts}`, name: `子-${ts}`, parentId: parent.id, sortOrder: 3, status: 'ACTIVE' }
    })).json();

    // Try to set grandparent's parentId = child (grandchild) — should fail
    const resp = await request.put(`${API}/material-categories/${grandparent.id}`, {
      ...h, data: { parentId: child.id }
    });
    // Backend should detect circular reference
    expect(resp.status()).toBeGreaterThanOrEqual(400);

    // Cleanup
    await request.delete(`${API}/material-categories/${child.id}`, h).catch(() => {});
    await request.delete(`${API}/material-categories/${parent.id}`, h).catch(() => {});
    await request.delete(`${API}/material-categories/${grandparent.id}`, h).catch(() => {});
  });
});
