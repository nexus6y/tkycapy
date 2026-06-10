/**
 * 菜单路由 E2E — 遍历菜单叶子节点，断言页面可访问（不 404/500）
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入用户名"]', 'admin');
  await page.fill('input[placeholder="请输入密码"]', 'admin123');
  await page.click('button:has-text("登 录")');
  await page.waitForURL('**/');
  await page.waitForTimeout(500);
}

/** Visit a route and verify no 404/500 error */
async function verifyPage(page: any, url: string, label: string) {
  await page.goto(`${BASE}${url}`);
  await page.waitForTimeout(2000);

  // No 500 Internal Server Error
  const err500 = await page.locator('text=Internal server error').count();
  expect(err500, `${label}: must not show 500 error`).toBe(0);

  // No Next.js 404 page
  const err404 = await page.locator('text=This page could not be found').count();
  expect(err404, `${label}: must not show 404`).toBe(0);

  // Page body should have content
  const body = page.locator('body');
  const text = await body.innerText();
  expect(text.length, `${label}: page should have content`).toBeGreaterThan(0);
}

// Menu leaves with their paths — all should be valid
const ROUTES = [
  ['/contract', '合同维护'],
  ['/contract/params', '合同参数'],
  ['/contract/query', '合同查询'],
  ['/material', '物料档案'],
  ['/material-category', '物料分类'],
  ['/material-param', '物料参数'],
  ['/material-approval', '物料审批'],
  ['/project', '项目维护'],
  ['/project/query', '项目查询'],
  ['/sales/customer', '客户档案'],
  ['/sales/params', '销售参数'],
  ['/sales/quotation', '报价单维护'],
  ['/sales/pre-order', '分劈单维护'],
  ['/sales/order', '销售订单维护'],
  ['/sales/shipment', '销售出货维护'],
  ['/sales/return', '销售退货维护'],
  ['/sales/trace', '销售执行追溯'],
  ['/ops/demand-plan', '需求计划维护'],
  ['/ops/demand-query', '需求计划查询'],
  ['/purchase/supplier', '供应商档案'],
  ['/purchase/params', '采购参数'],
  ['/purchase/plan', '采购计划维护'],
  ['/purchase/order', '采购订单维护'],
  ['/purchase/return', '退供单维护'],
  ['/purchase/trace', '采购合同追溯'],
  ['/quality/params', '质检参数'],
  ['/quality/inspection', '质检单维护'],
  ['/quality/defective', '不良品台账'],
  ['/quality/inspection-query', '质检单查询'],
  ['/production/bom', 'BOM维护'],
  ['/production/bom-diff', 'BOM差异分析'],
  ['/production/process', '标准工序'],
  ['/production/route', '工艺路线'],
  ['/production/order', '生产订单工作台'],
  ['/production/change', '生产变更'],
  ['/production/issue', '领料单维护'],
  ['/production/return', '退料单维护'],
  ['/production/issue-trace', '领料全追溯'],
  ['/production/complete-audit', '完工报告审核'],
  ['/production/damage-audit', '制损单审核'],
  ['/warehouse/area', '地区'],
  ['/warehouse/warehouse', '仓库'],
  ['/warehouse/zone', '储区'],
  ['/warehouse/passage', '通道'],
  ['/warehouse/shelf', '货架'],
  ['/warehouse/location', '货位'],
  ['/warehouse/arrival', '到货确认'],
  ['/warehouse/inbound', '入库单维护'],
  ['/warehouse/inbound-query', '入库单查询'],
  ['/warehouse/outbound', '出库单维护'],
  ['/warehouse/outbound-query', '出库单查询'],
  ['/warehouse/stock', '库存查询'],
  ['/warehouse/check', '盘点单维护'],
  ['/cost/carry-over', '结转维护'],
  ['/cost/carry-order', '结转订单'],
  ['/cost/procure-in', '采购入库'],
  ['/cost/procure-out', '采购退供'],
  ['/system/dept', '组织机构'],
  ['/system/user', '用户管理'],
  ['/system/role', '角色管理'],
  ['/system/menu', '菜单管理'],
  ['/system/permission', '权限分配'],
  ['/system/dict', '字典管理'],
  ['/system/log/login', '登录日志'],
  ['/system/log/operate', '操作日志'],
];

test.describe('Menu Routes — No 404', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  for (const [url, label] of ROUTES) {
    test(`${label} (${url})`, async ({ page }) => {
      await verifyPage(page, url, label as string);
    });
  }
});
