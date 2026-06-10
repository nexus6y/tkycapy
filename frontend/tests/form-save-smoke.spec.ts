/**
 * 全系统表单保存契约 Smoke E2E
 * 运行：pnpm test:e2e:form-save-smoke
 *
 * 策略：直接通过 API POST/PUT 验证，断言 status < 400 且记录落库。
 * 这是一种比 UI 驱动更快、更稳定的持久化测试方法。
 */
import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function getToken(request: any): Promise<string> {
  const resp = await request.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } });
  return (await resp.json()).token;
}
function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }

test.describe('表单保存 Smoke (API)', () => {

  test('1. material-category — POST 200 + 落库 + PUT', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const code = `SMK-${ts}`;

    // Create without parent
    const resp1 = await request.post(`${API}/material-categories`, { ...h, data: { code, name: `烟测分类-${ts}`, sortOrder: 1, status: 'ACTIVE' } });
    expect(resp1.status()).toBeGreaterThanOrEqual(200);
    expect(resp1.status()).toBeLessThan(400);
    const created = await resp1.json();
    expect(created.id).toBeTruthy();
    expect(created.parentId).toBeFalsy(); // top-level

    // Verify in list
    const list = await request.get(`${API}/material-categories?code=${code}`, h);
    const items = (await list.json()).items;
    expect(items.length).toBeGreaterThanOrEqual(1);

    // Update
    const put = await request.put(`${API}/material-categories/${created.id}`, { ...h, data: { name: `烟测分类改-${ts}` } });
    expect(put.status()).toBeLessThan(400);

    // Cleanup
    await request.delete(`${API}/material-categories/${created.id}`, h).catch(() => {});
  });

  test('2. material-category — 重复code → 400', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const code = `DUPSMK-${ts}`;
    await request.post(`${API}/material-categories`, { ...h, data: { code, name: `重复1-${ts}`, sortOrder: 1, status: 'ACTIVE' } });
    const dup = await request.post(`${API}/material-categories`, { ...h, data: { code, name: `重复2-${ts}`, sortOrder: 2, status: 'ACTIVE' } });
    expect(dup.status()).toBeGreaterThanOrEqual(400);
    // Cleanup first one
    const list = await request.get(`${API}/material-categories?code=${code}`, h);
    for (const c of (await list.json()).items) await request.delete(`${API}/material-categories/${c.id}`, h).catch(() => {});
  });

  test('3. project — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const code = `PRJ-${ts}`;
    const resp = await request.post(`${API}/projects`, { ...h, data: { code, name: `烟测项目-${ts}`, source: 'E2E' } });
    expect(resp.status()).toBeLessThan(400);
    const p = await resp.json();
    expect(p.id).toBeTruthy();
    await request.delete(`${API}/projects/${p.id}`, h).catch(() => {});
  });

  test('4. contract — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/contracts`, { ...h, data: {
      name: `烟测合同-${ts}`, type: '销售合同', currencyType: '人民币',
      receiptPaymentMethod: '一次性付', amountType: '固定总价', totalAmount: '50000',
      effectiveDate: '2026-07-01', undertakerName: 'E2E',
    } });
    expect(resp.status()).toBeLessThan(400);
    const c = await resp.json();
    expect(c.id).toBeTruthy();
    expect(c.code).toBeTruthy();
    await request.delete(`${API}/contracts/${c.id}`, h).catch(() => {});
  });

  test('5. customer — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const code = `CUS-${ts}`;
    const resp = await request.post(`${API}/customers`, { ...h, data: { code, name: `烟测客户-${ts}`, status: 'ACTIVE' } });
    expect(resp.status()).toBeLessThan(400);
    const c = await resp.json();
    expect(c.id).toBeTruthy();
    await request.delete(`${API}/customers/${c.id}`, h).catch(() => {});
  });

  test('6. supplier — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const code = `SUP-${ts}`;
    const resp = await request.post(`${API}/suppliers`, { ...h, data: { code, name: `烟测供应商-${ts}`, status: 'ACTIVE' } });
    expect(resp.status()).toBeLessThan(400);
    const s = await resp.json();
    expect(s.id).toBeTruthy();
    await request.delete(`${API}/suppliers/${s.id}`, h).catch(() => {});
  });

  test('7. quotation — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/quotations`, { ...h, data: {
      quotationName: `烟测报价-${ts}`, customerName: '测试客户',
      totalAmount: '5000',
    } });
    expect(resp.status()).toBeLessThan(400);
    const q = await resp.json();
    expect(q.id).toBeTruthy();
    await request.delete(`${API}/quotations/${q.id}`, h).catch(() => {});
  });

  test('8. purchase-plan — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/purchase-plans`, { ...h, data: {
      orderName: `烟测采购计划-${ts}`,
    } });
    expect(resp.status()).toBeLessThan(400);
    const p = await resp.json();
    expect(p.id).toBeTruthy();
    await request.delete(`${API}/purchase-plans/${p.id}`, h).catch(() => {});
  });

  test('9. purchase-order — POST 200 + lines 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const supR = await request.get(`${API}/suppliers?pageSize=1`, h);
    const sup = (await supR.json()).items[0];
    const resp = await request.post(`${API}/purchase-orders`, { ...h, data: {
      orderName: `烟测采购订单-${ts}`,
      supplierId: sup?.id, supplierName: sup?.name,
      totalAmount: '100000',
      lines: [
        { lineNo: 1, materialCode: 'SMOKE-001', materialName: '烟测物料', spec: '100mm', unit: 'pcs', quantity: '10', unitPrice: '10000', amount: '100000' },
      ],
    } });
    expect(resp.status()).toBeLessThan(400);
    const po = await resp.json();
    expect(po.id).toBeTruthy();
    // Verify lines were saved
    const detail = await request.get(`${API}/purchase-orders/${po.id}`, h);
    const d = await detail.json();
    expect(d.lines).toBeDefined();
    expect(d.lines.length).toBeGreaterThanOrEqual(1);
    await request.delete(`${API}/purchase-orders/${po.id}`, h).catch(() => {});
  });

  test('10. check-order — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/check-orders`, { ...h, data: {
      materialName: `烟测盘点-${ts}`,
      stockQty: '100', checkQty: '98', diffQty: '-2',
      inspector: 'E2E',
    } });
    expect(resp.status()).toBeLessThan(400);
    const c = await resp.json();
    expect(c.id).toBeTruthy();
    await request.delete(`${API}/check-orders/${c.id}`, h).catch(() => {});
  });

  test('11. inbound-order — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/inbound-orders`, { ...h, data: {
      materialName: `烟测入库-${ts}`,
      quantity: '50', qualifiedQty: '50', unitPrice: '20', totalAmount: '1000',
      receiptDate: '2026-06-01',
    } });
    expect(resp.status()).toBeLessThan(400);
    const o = await resp.json();
    expect(o.id).toBeTruthy();
    await request.delete(`${API}/inbound-orders/${o.id}`, h).catch(() => {});
  });

  test('12. outbound-order — POST 200 + 落库', async ({ request }) => {
    const token = await getToken(request); const h = auth(token); const ts = Date.now();
    const resp = await request.post(`${API}/outbound-orders`, { ...h, data: {
      materialName: `烟测出库-${ts}`,
      quantity: '30', unitPrice: '15', totalAmount: '450',
      shipmentDate: '2026-06-01',
    } });
    expect(resp.status()).toBeLessThan(400);
    const o = await resp.json();
    expect(o.id).toBeTruthy();
    await request.delete(`${API}/outbound-orders/${o.id}`, h).catch(() => {});
  });
});
