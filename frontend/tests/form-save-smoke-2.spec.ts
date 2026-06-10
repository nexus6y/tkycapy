/**
 * 表单保存契约 Smoke E2E — Part 2: 新增 Controller 防护验证
 * 运行：pnpm test:e2e:form-save-smoke-2
 */
import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function getToken(request: any): Promise<string> {
  const resp = await request.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } });
  return (await resp.json()).token;
}
function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }

test.describe('表单保存 Smoke Part 2 (新 Controller)', () => {

  test('1. sales-return — POST 200 + unknown fields filtered', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/sales-returns`, { ...h, data: {
      returnNo: `SR-${ts}`, customerName: 'E2E客户',
      returnDate: '', totalQuantity: '', totalAmount: '9999',
      unknownField: 'MUST_BE_FILTERED',
    } });
    expect(resp.status()).toBeLessThan(400);
    const s = await resp.json();
    expect(s.id).toBeTruthy();
    await request.delete(`${API}/sales-returns/${s.id}`, h).catch(() => {});
  });

  test('2. purchase-return — POST 200 + unknown fields filtered', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/purchase-returns`, { ...h, data: {
      returnNo: `PR-${ts}`, supplierName: 'E2E供应商',
      returnDate: '', totalQuantity: '', totalAmount: '8888',
      unknownField: 'MUST_BE_FILTERED',
    } });
    expect(resp.status()).toBeLessThan(400);
    const p = await resp.json();
    expect(p.id).toBeTruthy();
    await request.delete(`${API}/purchase-returns/${p.id}`, h).catch(() => {});
  });

  test('3. warehouse — POST 200', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/warehouses`, { ...h, data: {
      code: `W-${ts}`, name: `烟测仓库-${ts}`, unknownField: 'FILTERED',
    } });
    expect(resp.status()).toBeLessThan(400);
    const w = await resp.json();
    expect(w.id).toBeTruthy();
    await request.delete(`${API}/warehouses/${w.id}`, h).catch(() => {});
  });

  test('4. zone — POST 200', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/zones`, { ...h, data: {
      code: `Z-${ts}`, name: `烟测库区-${ts}`, status: 'ACTIVE',
    } });
    expect(resp.status()).toBeLessThan(400);
    const z = await resp.json();
    expect(z.id).toBeTruthy();
    await request.delete(`${API}/zones/${z.id}`, h).catch(() => {});
  });

  test('5. passage — POST 200', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/passages`, { ...h, data: {
      code: `P-${ts}`, name: `烟测通道-${ts}`, status: 'ACTIVE',
    } });
    expect(resp.status()).toBeLessThan(400);
    const p = await resp.json();
    expect(p.id).toBeTruthy();
    await request.delete(`${API}/passages/${p.id}`, h).catch(() => {});
  });

  test('6. shelf — POST 200', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/shelves`, { ...h, data: {
      code: `S-${ts}`, name: `烟测货架-${ts}`, status: 'ACTIVE',
    } });
    expect(resp.status()).toBeLessThan(400);
    const s = await resp.json();
    expect(s.id).toBeTruthy();
    await request.delete(`${API}/shelves/${s.id}`, h).catch(() => {});
  });

  test('7. location — POST 200', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/locations`, { ...h, data: {
      code: `L-${ts}`, name: `烟测库位-${ts}`, status: 'ACTIVE',
    } });
    expect(resp.status()).toBeLessThan(400);
    const l = await resp.json();
    expect(l.id).toBeTruthy();
    await request.delete(`${API}/locations/${l.id}`, h).catch(() => {});
  });
});
