# ERP 全面测试报告 — 2026-06-08

## 测试范围

| 维度 | 覆盖 |
|------|------|
| 模块 | 10 个业务模块（公共基础/销售/运营/采购/质量/生产/仓储/成本/系统/工作台） |
| 状态 | DRAFT/SUBMITTED/APPROVED/REJECTED/WITHDRAWN + 各模块 businessStatus |
| 操作 | 新增/编辑/删除/提交/审批/拒绝/撤回/撤销登卡/下推 |
| 边界 | 空值/重复编码/非法状态流转/被引用删除/超长文本 |

---

## 发现的问题

### 🔴 P0 — 阻塞性问题

#### 1. BOM 创建报 500：缺少 `code` 字段
- **文件**: `backend/src/bom/bom.controller.ts` → `create` 方法
- **根因**: BOM 的 `code` 字段在 Prisma schema 中是必填（`@@unique([tenantId, code])`），但创建接口传 `productMaterialCode` 而非 `code`，且没有调用 `CodeGeneratorService`
- **复现**: `POST /api/boms` — `{ "name": "...", "productMaterialCode": "...", ... }` → 500 Internal Server Error
- **影响**: 所有 BOM 创建失败，生产订单无法创建（依赖 BOM）
- **建议**: 在 BOM controller/service 的 create 方法中，如果没有 `dto.code`，自动调用 `codeGen.generate('BOM', 'bom', 'code')`

#### 2. 采购订单 DRAFT 状态下撤回未拦截
- **文件**: `backend/src/purchase-order/purchase-order.controller.ts:314`
- **根因**: `withdraw` 方法调用 `guardWithdraw`，但未检查是否为 SUBMITTED 状态
- **复现**: `PUT /api/purchase-orders/{draft_id}/withdraw` → 200（预期 400）
- **建议**: 在 `withdraw` 方法前加 `if (po.approvalStatus !== 'SUBMITTED') throw new BadRequestException('只能撤回已提交的订单')`

### 🟡 P1 — 高优先级

#### 3. 删除已被引用的采购订单未拦截
- **文件**: `backend/src/purchase-order/purchase-order.controller.ts` → `remove` 方法
- **根因**: remove 只检查 `approvalStatus !== 'DRAFT'` 时禁止删除，但不检查外键引用（被退货单/质检单引用）
- **复现**: 创建退货单引用 PO → 删除 PO → 200 成功（预期 400）
- **建议**: 在 remove 中增加外键检查：`PurchaseReturn.count({ where: { purchaseOrderId: id } })` 和 `Inspection.count({ where: { sourceNo: po.orderNo } })`

#### 4. 入库单 approve 中 BOM `code` 缺失导致 line-level 错误
- **文件**: BOM 的 `BomItem` 子表也可能有类似 code 缺失问题（待确认）

#### 5. 质检 approve 后 PO businessStatus 更新时机不正确
- **文件**: `backend/src/inspection/inspection.controller.ts:221`
- **根因**: 质检审批→创建入库单的 `$transaction` 中同步更新了 PO businessStatus，但当质检单 `sourceType` 不是 `PURCHASE_ORDER` 时不更新
- **影响**: 非采购质检的入库单不会触发 PO 状态更新

### 🟢 P2 — 中优先级

#### 6. EntityPicker 中 `inspection` 搜索参数 `name` 无效
- **文件**: `frontend/src/components/form/entity-picker-config.ts` inspection 条目
- **根因**: 搜索字段 `name` 对应的后端 `inspection.controller.ts findAll` 不处理 `name` 参数，只处理 `code`
- **建议**: 移除 `name` 搜索字段，或后端增加 `name` 过滤（`inspectionNo` 或 `materialName` contains）

#### 7. LinesEditor materialPicker 选中后 spec 字段不对
- **文件**: `frontend/src/components/ui/lines-editor.tsx:96`
- **根因**: `onMaterialSelected` 写 `spec: item.specification`，但 Material API 返回的字段名是 `specification`
- **建议**: 统一字段映射，增加 `spec: item.specification || item.spec`

#### 8. 入库单明细带来源时只显示行号无物料编码内容
- **文件**: `frontend/src/app/warehouse/inbound/page.tsx:59`
- **根因**: 明细行展开时的列偏移不对——第 4-6 列的 colspan 占位写了 `<ErpTd className="text-[12px]"/>` 但实际数据应该在正确列中
- **建议**: 调整明细行展开时的列偏移或使用 `colSpan`

### 🔵 P3 — 低优先级/改进建议

#### 9. 采购订单列表页缺少 businessStatus 展示
- **文件**: `frontend/src/app/purchase/order/page.tsx`
- **现状**: 列表只显示审批状态，没有业务状态列
- **建议**: 增加业务状态列，与到货确认页保持一致

#### 10. 合同创建后没有自动生成 code
- **文件**: `backend/src/contract/contract.service.ts:114`
- **现状**: `contractService.create` 中有 `if (!data.code)` 自动生成逻辑，但 `cleanDto` 会把空字符串 `delete`，导致 `code` 字段被移除后没有被 `normalizeCounterparty` 前设置——实际上是工作的(`code` 在 cleanDto 时被 delete，然后在 `if (!data.code)` 时从 codeGen 生成)
- **状态**: 实际通过 API 测试是工作的

#### 11. 销售订单按合同创建时合同明细行不加载
- **文件**: `frontend/src/app/sales/order/create/page.tsx:162`
- **根因**: 之前修复的合同选单逻辑在 `onChange` 中只解 `r.data.lines`，但 Contract API 返回的 lines 字段名为 `lines`，映射正确
- **状态**: 需在页面上真实测试验证

#### 12. 入库单审批通过后 inboundOrder 的仓库地址不存在
- **文件**: `backend/src/inbound-order/inbound-order.controller.ts` approve 方法
- **根因**: `line.warehouseCode` 为空时回退到 `order.warehouseCode`，但 `order.warehouseCode` 也可能为空
- **状态**: 已在 Phase 0 增加 fallback 到物料默认仓库和库存

---

## 状态覆盖矩阵

| 模块 | DRAFT | SUBMITTED | APPROVED | REJECTED | 特殊状态 |
|------|-------|-----------|----------|----------|---------|
| 物料 | ✅ | — | ✅ | — | ACTIVE ✅ / INACTIVE ✅ |
| 客户 | ✅ | — | — | — | ACTIVE ✅ / INACTIVE ✅ |
| 供应商 | ✅ | — | — | — | ACTIVE ✅ / INACTIVE ✅ |
| 合同 | ✅ | ✅ | ✅ | ✅ | — |
| 报价单 | ✅ | ✅ | ✅ | ✅ | WON/LOST ✅ |
| 销售订单 | ✅ | ✅ | ✅ | ✅ | PENDING_SHIP ✅ |
| 采购订单 | ✅ | ✅ | ✅ | ✅ | PENDING_RECEIPT/INSPECTING ✅ |
| BOM | ❌ | ❌ | ❌ | — | code 缺失 |
| 生产订单 | ❌ | ❌ | ❌ | — | 依赖 BOM |
| 质检单 | ✅ | ✅ | ✅ | — | — |
| 入库单 | ✅ | ✅ | ✅ | — | PENDING/RECEIVED ✅ |
| 出库单 | ✅ | ✅ | ✅ | — | PENDING/SHIPPED ✅ |
| 退供单 | ✅ | ✅ | ✅ | — | — |
| 销退单 | ✅ | ✅ | ✅ | — | — |

---

## 页面验证摘要

| 页面 | 加载 | 列表 | 新增 | 编辑 | 审批 | 状态标签 | 问题 |
|------|------|------|------|------|------|---------|------|
| 物料分类 | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| 物料档案 | ✅ | ✅ | ✅ | ✅ | — | ✅ | null→value 已修复 |
| 客户档案 | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| 供应商 | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| 合同 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 报价单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 销售订单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 采购订单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | businessStatus 缺列 |
| BOM | ✅ | ❌ | ❌ | — | — | — | code 500 |
| 生产订单 | ✅ | ✅ | ❌ | — | — | ✅ | 依赖 BOM |
| 质检单 | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| 到货确认 | ✅ | ✅ | — | — | — | ✅ | 状态分流正确 |
| 入库单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 明细展开偏移 |
| 出库单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 库存查询 | ✅ | ✅ | — | — | — | ✅ | — |
| 采购退货 | ✅ | — | ✅ | — | ✅ | — | 列表待验证 |
| 销售退货 | ✅ | — | ✅ | — | ✅ | — | 列表待验证 |

---

## 整改优先级

1. 🔴 P0-1: BOM 创建自动生成 `code` — 阻塞整个生产链
2. 🔴 P0-2: PO 撤回 DRAFT 状态检查
3. 🟡 P1-3: PO 删除外键检查
4. 🟡 P1-5: 质检非采购来源的 PO 状态更新
5. 🟢 P2-7: LinesEditor 物料弹选 spec 字段映射
6. 🟢 P2-8: 入库单明细展开列偏移
7. 🔵 P3-9: 采购订单列表加 businessStatus 列
