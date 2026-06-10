# 全系统表单保存契约审计报告 — 2026-06-02

## E2E 测试覆盖率

| 测试套 | 通过 | 总数 | 类型 |
|--------|------|------|------|
| ui-smoke-no500.spec.ts | 37 | 37 | UI open→fill→save→no500 |
| form-save-ui.spec.ts | 20 | 20 | UI edit persist 16, API backup 4 |
| form-save-smoke.spec.ts | 12 | 12 | API POST |
| form-save-smoke-2.spec.ts | 7 | 7 | API POST |
| material-category.spec.ts | 6 | 6 | parentId/null/self/circular |
| contract.spec.ts | 5 | 5 | 合同CRUD |
| purchase-contract-linkage.spec.ts | 3 | 3 | 采购合同联动 |
| dialog-opacity.spec.ts | 4 | 4 | 弹窗透明度 |
| create-buttons.spec.ts | 31 | 31 | 新增按钮跳转 |
| **合计** | **125** | **125** | |

## UI Edit Persist (16 UI + 4 API)

| # | 模块 | UI? | vf | 结果 |
|---|------|-----|----|------|
| 1 | 物料分类 | UI label | name | ✅ |
| 2 | 仓库 | UI label | name | ✅ |
| 3 | 客户 | UI label | name | ✅ |
| 4 | 供应商 | UI label | name | ✅ |
| 5 | 项目 | UI label | name | ✅ |
| 6 | 部门 | UI label | name | ✅ |
| 7 | 字典 | UI label | name | ✅ |
| 8 | 工序 | UI label | name | ✅ |
| 9 | 退料 | UI label | materialName | ✅ |
| 10 | 工艺路线 | UI testid | name | ✅ |
| 11 | 销售退货 | UI testid | returnReason | ✅ |
| 12 | 采购退货 | UI testid | materialName | ✅ |
| 13 | 合同 | UI testid | name | ✅ |
| 14 | 采购订单 | UI testid | orderName | ✅ (added approvalStatus to state) |
| 15 | 领料 | UI label | spec | ✅ |
| 16 | 采购计划 | UI testid | orderName | ✅ (added approvalStatus to state, editable guard, clean payload) |
| B1 | 合同 backup | API PUT | name | ✅ |
| B2 | 采购计划 backup | API PUT | orderName | ✅ |
| B3 | 采购订单 backup | API PUT | orderName | ✅ |
| B4 | 领料 backup | API PUT | materialName | ✅ |

### 采购计划 UI 说明

已修复：PurchasePlan edit 页面：
1. 加载详情时显式写入 `approvalStatus` 到 state（默认 `'DRAFT'`）
2. 添加 `editable` 守卫：`!f.approvalStatus || f.approvalStatus === 'DRAFT'`
3. 保存 payload 仅包含 Prisma 有效字段（排除 `supplierCode`、`materialCode`、`specification`、`unit`、`totalAmount` 等无效字段）
4. `onSave={editable ? save : noop}` — DRAFT 或空状态可编辑，已提交/审批不可编辑
5. 非 editable 时显示警告横幅，禁用所有输入

## Controller DTO — 35/35 pickAllowed

## 前端直传 65 处

由后端 pickAllowed 白名单防护。所有 Controller create/update 均已 pickAllowed + empty clean + date/decimal convert。

## 构建

| 项目 | 结果 |
|------|------|
| nest build | ✅ |
| next build (132 页) | ✅ |
| Prisma validate | ✅ |
