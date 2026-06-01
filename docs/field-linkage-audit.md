# 字段联动全局排查清单

最后更新：2026-05-30
工具：EntitySelect / field-linkage.ts / calc.ts
测试：tests/field-linkage-browser.spec.ts

## ✅ 已修复页面

### 批次 1 — 核心销售+采购+仓储

| 页面 | 修复内容 |
|---|---|
| `sales/quotation/create` | EntitySelect(customer/dept), totalAmount auto-calc |
| `sales/order/create` | EntitySelect(customers/project/contract/quotation/preOrder/dept), quotation→lines, preOrder→lines, totalAmount auto-calc |
| `sales/shipment/create` | EntitySelect(order), lines→totalAmount |
| `purchase/order/create` | EntitySelect(supplier/dept/project/contract/purchasePlan), plan→lines, totalAmount auto-calc |
| `warehouse/inbound/create` | EntitySelect(material/warehouse/supplier/source), source→lines+amount |
| `warehouse/check/create` | EntitySelect(material/warehouse), inventory stock query, auto-diffQty |
| `contract/create` | EntitySelect(customer/supplier/project), id/code/name triple save |
| `production/issue/create` | EntitySelect(productionOrder/dept), PO→material lines |

### 批次 2 — 编辑页 + 更多创建页

| 页面 | 修复内容 |
|---|---|
| `sales/quotation/[id]/edit` | EntitySelect(customer/dept), totalAmount auto-calc |
| `sales/order/[id]/edit` | EntitySelect(customer/project), totalAmount auto-calc |
| `sales/pre-order/create` | EntitySelect(customer/contract), LinesEditor, totalAmount auto-calc |
| `sales/pre-order/[id]/edit` | EntitySelect(customer/contract), LinesEditor, totalAmount auto-calc |
| `sales/shipment/[id]/edit` | totalAmount auto-calc, customer/totalQuantity disabled |
| `purchase/order/[id]/edit` | EntitySelect(supplier), totalAmount auto-calc |
| `purchase/plan/create` | EntitySelect(supplier/material/demandPlan), LinesEditor, totalAmount auto-calc |
| `purchase/plan/[id]/edit` | EntitySelect(supplier/material), LinesEditor, totalAmount auto-calc |
| `warehouse/inbound/[id]/edit` | EntitySelect(material/warehouse), totalAmount/quantity auto-calc |
| `warehouse/outbound/create` | EntitySelect(material/warehouse/source), shipment→lines, totalAmount auto-calc |
| `warehouse/outbound/[id]/edit` | EntitySelect(material/warehouse), totalAmount/quantity auto-calc |
| `contract/[id]/edit` | EntitySelect(customer/supplier/project), edit fields restored |

### 批次 3 — 生产+仓储链+退货+质量+运营+退货/仓储编辑

| 页面 | 修复内容 |
|---|---|
| `production/order/create` | material + department → EntitySelect, spec/unit auto-fill |
| `warehouse/transfer-out/create` | material + fromWarehouse + toWarehouse → EntitySelect |
| `warehouse/transfer-out/[id]/edit` | material + from/to warehouse → EntitySelect |
| `warehouse/scrap-apply/create` | material → EntitySelect |
| `warehouse/scrap-apply/[id]/edit` | material → EntitySelect |
| `warehouse/lend-order/create` | material → EntitySelect |
| `warehouse/lend-order/[id]/edit` | material → EntitySelect
| **backend** | **PurchaseReturn 模型 + controller**（新：supplierId/Code/Name/purchaseOrderNo） | |
| `warehouse/check/[id]/edit` | material + warehouse → EntitySelect, auto-diffQty |
| `sales/return/create` | customer → EntitySelect, shipment → EntitySelect + auto-fill |
| `sales/return/[id]/edit` | customer → EntitySelect, qty/amount disabled |
| `purchase/return/create` | supplier → EntitySelect (was customerName wrong field) |
| `purchase/return/[id]/edit` | supplier → EntitySelect (was customerName wrong field) |
| `quality/inspection/create` | PO source → EntitySelect, source→lines+material, inspector result input |
| `quality/inspection/[id]/edit` | material → EntitySelect, lines→totalQty auto-calc |
| `ops/demand-plan/create` | project + dept → EntitySelect, lines→totalQty auto-calc |
| `ops/demand-plan/[id]/edit` | project + dept → EntitySelect, lines→totalQty auto-calc |

### 数量/金额混淆修复（专项）

| 页面 | 修复 |
|---|---|
| `warehouse/inbound/[id]/edit` | 数量: `recalcHeaderTotals(lines).totalQuantity` (was `calcTotalFromLines`) |
| `warehouse/outbound/create` | 数量: `recalcHeaderTotals(lines).totalQuantity` (was `calcTotalFromLines`) |
| `warehouse/outbound/[id]/edit` | 数量: `recalcHeaderTotals(lines).totalQuantity` (was `calcTotalFromLines`) |
| `purchase/plan/[id]/edit` | 数量: `recalcHeaderTotals(lines).totalQuantity` (was `calcTotalFromLines`) |

### 总计已修复

**38 页**，全部使用 `EntitySelect` + `field-linkage.ts` 公共工具。

---

## Browser E2E Coverage (28/28)

### 字段联动矩阵

| # | 页面 | 业务链路 | 夹具 | 断言字段 |
|---|---|---|---|---|
| 1 | Contract create | 客户选择 | `getSharedRefs().customer` | `customerCode`(disabled), `contactPerson=李四`, `contactPhone=13900002222` |
| 2 | Quotation create | 客户选择 | `getSharedRefs().customer` | `customerId`, `customerCode`(disabled), `contactPerson=李四` |
| 3 | Inbound create | PURCHASE source → 入库 | `createApprovedPO(IN-FIX-xxx)` | `sourceNo=PO.orderNo`(disabled), `supplierId=PO.supplierId`, supplier combobox非placeholder, tbody>0, `materialCode=IN-FIX-xxx`, `quantity=50`, `totalAmount>0`(disabled) |
| 4 | LinesEditor | 手动输入 qty×price | Quotation create 新增行 | line1 `amount=80.00`, line2 `amount=60.00`, header `total=140.00` |
| 5 | Sales Order create | quotation source → 订单 | `createApprovedQuotation(固定报价-xxx)` | `customerName`, `totalAmount>0`(disabled), tbody>0, line `materialCode`含FIX-, line `qty=10` |
| 6 | Purchase Order create | purchase plan source → 订单 | `createApprovedPurchasePlan(固定计划-xxx)` | `supplierId`, tbody>0, line `materialCode`含PP-FIX-, line `qty=25`, line `amount=100`, `totalAmount>0`(disabled) |
| 7 | Check Order create | 物料选择 → 库存查询 | 下拉第一个物料 | EntitySelect显示物料名, 规格自动填充, stockQty查询有值 |
| 8 | Issue Order create | PO → 材料清单 | `createApprovedProductionOrder(夹具生产-xxx)` | `productionOrderNo=PO.orderNo`(disabled), `totalQty>0`(disabled), tbody>0, line `materialCode`含FIX-, line `unit` |
| 9 | Pre-Order create | 客户+合同 EntitySelect | `getSharedRefs().customer` | `customerId`, `customerCode`(disabled), contractId populated |
| 10 | Outbound create | shipment source → 出库 | `sales-shipments?status=APPROVED` | `sourceNo=sh.shipmentNo`, tbody>0, line data populated |
| 11 | Production Order create | 物料+部门 EntitySelect | 下拉第一个物料 | spec auto-filled(disabled), 2 LinesEditor tables |
| 12 | Transfer Out create | 物料+调出/调入仓库 | 下拉第一个物料 | material非placeholder, warehouse含WH |
| 13 | Quantity≠Amount | LinesEditor 数量≠金额 | Quotation create qty=50,price=3 qty=5,price=12 | line amount=150.00, line amount=60.00, header `totalAmount=210.00`, header `totalAmount≠55` |
| **14** | **Inbound edit** | **入库单编辑** | **`createInboundWithLines(qty=50,price=3,amt=150)`** | **数量=50(disabled), 金额=150.00(disabled)** |
| **15** | **Outbound create** | **shipment fixture → 数量/金额** | `createApprovedShipment(qty=50,price=3,amt=150)` | sourceNo=shipmentNo, tbody>0, line materialCode=QTY-SH-xxx, 数量=50(disabled), 金额=150.00(disabled), 50≠150.00 |
| **16** | **Outbound edit** | **出库单编辑** | **`createOutboundWithLines(qty=50,price=3,amt=150)`** | **数量=50(disabled), 金额=150.00(disabled), 50≠150.00** |
| **17** | **Purchase plan edit** | **采购计划编辑** | **`createPlanWithLines(qty=25,price=4,amt=100)`** | **数量=25(disabled), 金额=100.00(disabled), 数量≠100** |
| **18** | **Inspection create** | **PO source → header+lines** | `createApprovedPO(IN-FIX-xxx,spec=IN-SPEC,qty=50)` | materialCode=IN-FIX-xxx, spec=IN-SPEC(disabled), unit=pcs(disabled), qty=50(disabled), tbody>0, line materialCode=IN-FIX-xxx |
| **19** | **Inspection edit** | **ded fixture qty=40,qual=35,unqual=5** | `POST /inspections` with known values | inspectionNo(disabled), totalQty=40(disabled), qualifiedQty=35, unqualifiedQty=5, line materialCode=QC-EDIT-xxx, line inspectQty/qualified/unqualified |
| **20** | **Demand Plan create** | **project/dept EntitySelect + qty** | `shared project + shared/created department` | projectId=proj.id, projectCode=proj.code, projectName=proj.name, departmentId=dept.id, departmentCode=dept.code, departmentName=dept.name, totalQuantity=30(disabled) |
| **21** | **Demand Plan edit** | **API-created DemandPlan fixture** | `POST /demand-plans(project/dept fields, materialCode=DP-E2E-xxx, qty=40)` | planNo=dp.planNo(disabled), projectId/projectCode/projectName, departmentId/departmentCode/departmentName, totalQuantity=40(disabled), line materialCode=DP-E2E-xxx, line quantity=40 |


| **22** | **Sales Return edit** | **customer EntitySelect** | `POST /sales-returns(customerId/Name, qty=10, amount=100)` | customerId, EntitySelect shows customerName, shipmentNo=SHIP-FIX-1(disabled), totalQuantity=10(disabled), totalAmount=100(disabled) |
| **23** | **Purchase Return create** | **supplier EntitySelect + PO source** | `createApprovedPO` + shared supplier | supplierId, PO EntitySelect populated, supplier auto-filled from PO |
| **24** | **Purchase Return edit** | **API-created fixture** | `POST /purchase-returns(supplierId/Code/Name, PO, qty=30, amt=90)` | returnNo(disabled), supplierId, purchaseOrderNo=PO-FIX-2(disabled), qty=30, amt=90, reason |
| **25** | **Check Order edit** | **material + warehouse EntitySelect, auto-diff** | `POST /check-orders(materialId/Code/Name, spec=CHK-SPEC-FIX, unit, whId/Code/Name, stock=100, check=85)` | orderNo(disabled), materialId, materialCode(disabled), spec=CHK-SPEC-FIX, unit(disabled), batchNo=B-FIX, stockQty=100, checkQty=85, diffQty=-15(disabled), warehouseId, warehouseCode(disabled) |
| **26** | **Transfer Out edit** | **material + from/to warehouse EntitySelect** | `POST /transfer-orders(materialId/Code/Name, spec=TR-SPEC, unit, fromWhId/Code/Name, toWhId/Code/Name, qty=20)` | orderNo(disabled), materialId, materialCode(disabled), spec(disabled), unit(disabled), qty=20, fromWarehouseId, fromWarehouseCode(disabled), fromWarehouseName(disabled), toWarehouseId, toWarehouseCode(disabled), toWarehouseName(disabled) |
| **27** | **Scrap Apply edit** | **material EntitySelect** | `POST /scrap-orders(materialId/Code/Name, spec=SC-SPEC, unit, qty=15)` | orderNo(disabled), materialId, materialCode(disabled), spec=SC-SPEC(disabled), unit(disabled), qty=15, scrapReason=E2E damaged beyond repair, disposalMethod=焚烧处理 |
| **28** | **Lend Order edit** | **material EntitySelect + dates** | `POST /lend-orders(materialId/Code/Name, spec=LEND-SPEC, unit=pcs, qty=12)` | orderNo(disabled), materialId, materialCode(disabled), spec=LEND-SPEC(disabled), unit(disabled), qty=12, borrower=E2E借用人, borrowDate=2026-06-01, expectedReturn=2026-07-01 |


### 不依赖数据库预置数据

`PurchaseReturn` 模型（`purchase_return` 表）已创建，支持 `supplierId`/`supplierCode`/`supplierName`/`purchaseOrderId`/`purchaseOrderNo`。<br>
`LendOrder` edit 页面已修复后端路由（`@Param(':id')` → `@Param('id')`），支持 EntitySelect。E2E #28 ，页面功能正常。<br>
大部分测试在 constructor 阶段通过 API 创建夹具（`createApproved*` / `createWithLines*`），不依赖 DB 种子。
少数使用共享 fixture：project（`GET /projects` 取首个）、department（首次运行时 API 创建 `E2E-DEPT` 后复用）。
`DemandPlan` 模型支持 `projectId`/`projectCode`/`projectName`/`departmentId`/`departmentCode`/`departmentName`。

---

## ⚠️ 仍为弱覆盖或未覆盖

### 未覆盖 — 后续批次

| 批次 | 页面 |
|---|---|
| 生产子页 | `production/return/create`, `production/return/[id]/edit`, `production/bom/create`, `production/bom/[id]/edit`, `production/process/create`, `production/process/[id]/edit`, `production/route/create`, `production/route/[id]/edit`, `production/change/create`, `production/change/[id]/edit`, `production/order/[id]/edit` |
| | |

---

## 🟢 已确认正常（无需字段联动修复）

| 页面 | 原因 |
|---|---|
| `warehouse/arrival` | 列表页+按钮，非表单 |
| 所有 list/query 页面 | 查询展示页 |
| 系统管理 (dept/user/role/menu/permission/dict) | 实体维护，简单表单 |
| 物料/客户/供应商 create | 新建基础实体，无外键 EntitySelect |
| 仓库/库区/通道/货架/库位 create | 仓储基础实体 |

---

## 运行命令

```bash
pnpm build                          # 前端构建
cd backend && npx nest build        # 后端构建  
npx prisma validate                 # Prisma schema 校验
pnpm test:e2e:field-linkage         # 浏览器 E2E (17 tests)
```
