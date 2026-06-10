/**
 * 表单 save+edit+modify 强断言 E2E
 * 策略: API create → page.goto edit → page.fill field → click save → GET verify persisted
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
async function getToken(r: any) { return (await (await r.post(`${API}/auth/login`, { data: { username: 'admin', password: 'admin123' } })).json()).token; }
function H(t: string) { return { headers: { Authorization: `Bearer ${t}` } }; }
function no500(p: any, l: string) { return expect.poll(() => p.locator('text=Internal server error').count(), { timeout: 5000, message: l }).toBe(0); }

/** UI edit: goto edit page → fill field → save → GET verify */
async function uiEdit(page: any, request: any, cfg: {
  label: string; api: string; data: any; ep: (id:string)=>string; sel:string; vf: string;
}) {
  const token = await getToken(request); const h = H(token); const ts = Date.now();
  const payload = JSON.parse(JSON.stringify(cfg.data).replace(/__TS__/g, `${ts}`));
  const nv = `${cfg.label}后-${ts}`;
  const c = await (await request.post(`${API}/${cfg.api}`, { ...h, data: payload })).json();
  expect(c.id, `${cfg.label}: create fail`).toBeTruthy();

  await page.goto(`${BASE}${cfg.ep(c.id)}`); await page.waitForTimeout(2500);
  await no500(page, cfg.label);
  const input = page.locator(cfg.sel);
  await input.click();
  await input.selectText();
  await input.type(nv, { delay: 2 });
  await page.waitForTimeout(500);
  await page.click('button:has-text("保存")'); await page.waitForTimeout(2000);
  await no500(page, `${cfg.label}-edit`);

  const u = await (await request.get(`${API}/${cfg.api}/${c.id}`, h)).json();
  expect(u[cfg.vf], `got "${u[cfg.vf]}" want "${nv}"`).toBe(nv);
  await request.delete(`${API}/${cfg.api}/${c.id}`, h);
}

/** API edit: POST → PUT → GET verify (for pages where UI edit form has guards) */
async function apiEdit(request: any, cfg: { label: string; api: string; data: any; vf: string }) {
  const token = await getToken(request); const h = H(token); const ts = Date.now();
  const payload = JSON.parse(JSON.stringify(cfg.data).replace(/__TS__/g, `${ts}`));
  const nv = `${cfg.label}后-${ts}`;
  const c = await (await request.post(`${API}/${cfg.api}`, { ...h, data: payload })).json();
  expect(c.id, `${cfg.label}: create fail`).toBeTruthy();
  const put = await request.put(`${API}/${cfg.api}/${c.id}`, { ...h, data: { [cfg.vf]: nv } });
  expect(put.status(), `${cfg.label}: PUT ${put.status()}`).toBeLessThan(400);
  const u = await (await request.get(`${API}/${cfg.api}/${c.id}`, h)).json();
  expect(u[cfg.vf]).toBe(nv);
  await request.delete(`${API}/${cfg.api}/${c.id}`, h);
}

// Helper: get supplier ID if available
async function getSupplierId(request: any) {
  const token = await getToken(request);
  const resp = await request.get(`${API}/suppliers?pageSize=1`, H(token));
  const items = (await resp.json()).items;
  return items?.[0]?.id || null;
}

test.describe('UI edit persist', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  const L = (lbl: string) => `label:has-text("${lbl}") + * input, label:has-text("${lbl}") ~ div input`;
  const T = (id: string) => `[data-testid="${id}"]`;

  test('物料分类', async ({ page, request }) => { await uiEdit(page,request,{ label:'MC', api:'material-categories', data:{code:'E2E-MC-__TS__',name:'MC前-__TS__',sortOrder:1,status:'ACTIVE'}, ep:id=>`/material-category/${id}/edit`, sel:L('分类名称'), vf:'name' }); });
  test('仓库', async ({ page, request }) => { await uiEdit(page,request,{ label:'仓库', api:'warehouses', data:{code:'E2E-WH-__TS__',name:'WH前-__TS__'}, ep:id=>`/warehouse/warehouse/${id}/edit`, sel:L('仓库名称'), vf:'name' }); });
  test('客户', async ({ page, request }) => { await uiEdit(page,request,{ label:'客户', api:'customers', data:{code:'E2E-CU-__TS__',name:'CU前-__TS__',status:'ACTIVE'}, ep:id=>`/sales/customer/${id}/edit`, sel:L('客户名称'), vf:'name' }); });
  test('供应商', async ({ page, request }) => { await uiEdit(page,request,{ label:'供应商', api:'suppliers', data:{code:'E2E-SU-__TS__',name:'SU前-__TS__',status:'ACTIVE'}, ep:id=>`/purchase/supplier/${id}/edit`, sel:L('供应商名称'), vf:'name' }); });
  test('项目', async ({ page, request }) => { await uiEdit(page,request,{ label:'项目', api:'projects', data:{code:'E2E-PJ-__TS__',name:'PJ前-__TS__'}, ep:id=>`/project/${id}/edit`, sel:L('项目名称'), vf:'name' }); });
  test('部门', async ({ page, request }) => { await uiEdit(page,request,{ label:'部门', api:'departments', data:{code:'E2E-DT-__TS__',name:'DT前-__TS__'}, ep:id=>`/system/dept/${id}/edit`, sel:L('部门名称'), vf:'name' }); });
  test('字典', async ({ page, request }) => { await uiEdit(page,request,{ label:'字典', api:'dictionaries', data:{code:'E2E-DC-__TS__',name:'DC前-__TS__'}, ep:id=>`/system/dict/${id}/edit`, sel:L('字典名称'), vf:'name' }); });
  test('工序', async ({ page, request }) => { await uiEdit(page,request,{ label:'工序', api:'processes', data:{code:'E2E-PR-__TS__',name:'PR前-__TS__'}, ep:id=>`/production/process/${id}/edit`, sel:L('工序名称'), vf:'name' }); });
  test('退料', async ({ page, request }) => { await uiEdit(page,request,{ label:'退料', api:'return-orders', data:{materialName:'RT物-__TS__',quantity:'3',departmentName:'E2E'}, ep:id=>`/production/return/${id}/edit`, sel:L('物料'), vf:'materialName' }); });
  test('工艺路线', async ({ page, request }) => { await uiEdit(page,request,{ label:'工艺路线', api:'process-routes', data:{code:'E2E-PT-__TS__',name:'PT前-__TS__'}, ep:id=>`/production/route/${id}/edit`, sel:T('route-name-input'), vf:'name' }); });
  test('销售退货', async ({ page, request }) => { await uiEdit(page,request,{ label:'销售退货', api:'sales-returns', data:{returnNo:'SR-__TS__',customerName:'SR前-__TS__',totalAmount:'5000',returnReason:'SR因-__TS__'}, ep:id=>`/sales/return/${id}/edit`, sel:T('sr-returnreason-input'), vf:'returnReason' }); });
  test('采购退货', async ({ page, request }) => { await uiEdit(page,request,{ label:'采购退货', api:'purchase-returns', data:{returnNo:'PR-__TS__',supplierName:'PR前-__TS__',totalAmount:'5000',materialName:'PR物-__TS__'}, ep:id=>`/purchase/return/${id}/edit`, sel:T('pr-materialname-input'), vf:'materialName' }); });
  test('合同', async ({ page, request }) => {
    const sid = await getSupplierId(request);
    await uiEdit(page,request,{ label:'合同', api:'contracts', data:{name:'CT前-__TS__',type:'采购合同',currencyType:'人民币',receiptPaymentMethod:'一次性付',amountType:'固定总价',totalAmount:'50000',effectiveDate:'2026-07-01',undertakerName:'测',supplierId:sid,supplierName:'E2E'}, ep:id=>`/contract/${id}/edit`, sel:T('contract-name-input'), vf:'name' });
  });
  test('采购计划', async ({ page, request }) => { await uiEdit(page,request,{ label:'采购计划', api:'purchase-plans', data:{orderName:'PP前-__TS__'}, ep:id=>`/purchase/plan/${id}/edit`, sel:T('plan-ordername-input'), vf:'orderName' }); });
  test('采购订单', async ({ page, request }) => { const sid = await getSupplierId(request); await uiEdit(page,request,{ label:'采购订单', api:'purchase-orders', data:{orderName:'PO前-__TS__',supplierId:sid||undefined,supplierName:'E2E',totalAmount:'100000',lines:[{lineNo:1,materialCode:'E2E',materialName:'E2E',spec:'mm',unit:'pcs',quantity:'10',unitPrice:'10000',amount:'100000'}]}, ep:id=>`/purchase/order/${id}/edit`, sel:T('po-ordername-input'), vf:'orderName' }); });
  test('领料', async ({ page, request }) => { await uiEdit(page,request,{ label:'领料', api:'issue-orders', data:{materialName:'IS前-__TS__',spec:'IS规-__TS__',quantity:'5',departmentName:'E2E'}, ep:id=>`/production/issue/${id}/edit`, sel:L('规格'), vf:'spec' }); });
});

test.describe('API edit persist', () => {
  test('合同 backup', async ({ request }) => { await apiEdit(request,{ label:'合同', api:'contracts', data:{name:'CT前-__TS__',type:'销售合同',currencyType:'人民币',receiptPaymentMethod:'一次性付',amountType:'固定总价',totalAmount:'50000',effectiveDate:'2026-07-01',undertakerName:'测'}, vf:'name' }); });
  test('采购计划 backup', async ({ request }) => { await apiEdit(request,{ label:'采购计划', api:'purchase-plans', data:{orderName:'PP前-__TS__'}, vf:'orderName' }); });
  test('采购订单 backup', async ({ request }) => { await apiEdit(request,{ label:'采购订单', api:'purchase-orders', data:{orderName:'PO前-__TS__',supplierName:'E2E',totalAmount:'100000',lines:[{lineNo:1,materialCode:'E2E',materialName:'E2E',spec:'mm',unit:'pcs',quantity:'10',unitPrice:'10000',amount:'100000'}]}, vf:'orderName' }); });
  test('领料 backup', async ({ request }) => { await apiEdit(request,{ label:'领料', api:'issue-orders', data:{materialName:'IS前-__TS__',quantity:'5',departmentName:'E2E'}, vf:'materialName' }); });
});
