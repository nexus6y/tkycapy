# 后端业务逻辑实现指南 (AI 可读)

> 基于原系统 http://39.156.151.205:8081 逆向 + 标准ERP业务模式
> 本文档定义后端必须实现的业务规则、校验逻辑、状态机

---

## 1. 通用编码自动生成规则

### 1.1 编码格式
```
物料: MAT{yymm}{seq:4}        → MAT26050001
客户: CUS{yymm}{seq:4}        → CUS26050001
供应商: SUP{yymm}{seq:4}       → SUP26050001
报价单: QTE{yyyymmdd}{seq:4}   → QTE202605270001
销售订单: SO{yyyymmdd}{seq:4}  → SO202605270001
采购订单: PO{yyyymmdd}{seq:4}  → PO202605270001
入库单: IN{yyyymmdd}{seq:4}    → IN202605270001
出库单: OUT{yyyymmdd}{seq:4}   → OUT202605270001
生产单: PROD{yyyymmdd}{seq:4}  → PROD202605270001
质检单: INS{yyyymmdd}{seq:4}   → INS202605270001
调拨单: TR{yyyymmdd}{seq:4}    → TR202605270001
```

### 1.2 生成逻辑
```typescript
// 创建时自动生成编码
async function generateCode(prefix: string, prisma: PrismaService, model: string, field: string) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const pattern = `${prefix}${dateStr}`;
  
  const last = await (prisma as any)[model].findFirst({
    where: { [field]: { startsWith: pattern } },
    orderBy: { [field]: 'desc' }
  });
  
  const seq = last ? parseInt(last[field].slice(-4)) + 1 : 1;
  return `${pattern}${String(seq).padStart(4, '0')}`;
}
```

### 1.3 编码可覆盖规则
- 表单上编码字段默认为"自动生成"（disabled）
- 用户可手动输入覆盖（点击解除disabled）
- 若手动输入，校验唯一性
- 若留空或选自动，使用生成规则

---

## 2. 通用字段校验规则

### 2.1 必填字段
| 实体 | 必填字段 |
|---|---|
| 所有基础实体 | code(编码), name(名称) |
| 物料 | code, name, categoryId, unitId |
| 客户/供应商 | code, name |
| 订单类 | orderNo(可自动生成), 关联实体(name/customer等) |
| 入库/出库单 | orderNo, materialName, quantity, warehouseName |

### 2.2 唯一性校验
| 字段 | 范围 |
|---|---|
| code/orderNo | tenantId + code 唯一 |
| 物料编码 | tenantId + code 唯一 |
| 客户编码 | tenantId + code 唯一 |
| 用户名 | tenantId + username 唯一 |

### 2.3 数值范围校验
| 字段 | 规则 |
|---|---|
| sortOrder | >= 0, 整数 |
| quantity | > 0 |
| unitPrice | >= 0 |
| 抽检比例 | 0-100 |
| 不合格比例下限 | 0-100 |

### 2.4 日期校验
| 规则 |
|---|
| endDate >= startDate |
| 单据日期 <= 当前日期 |
| 预计归还日期 >= 借出日期 |
| 会计期间不能重叠 |

---

## 3. 状态机定义

### 3.1 通用审批状态机
```
DRAFT ──[提交]──→ SUBMITTED ──[审批通过]──→ APPROVED
  ↑                 ↓                         ↓
  └──[重新编辑]── REJECTED ←──[审批拒绝]──────┘
                      ↓
                  [撤回] → DRAFT
```

**状态转换规则:**
| 当前状态 | 允许操作 |
|---|---|
| DRAFT | 编辑, 删除, 提交 |
| SUBMITTED | 审批通过, 审批拒绝, 撤回 |
| APPROVED | 下推到下游单据, (不可编辑/删除) |
| REJECTED | 重新编辑(回到DRAFT), 删除 |

**校验:**
- DRAFT 状态的单据才可编辑/删除
- SUBMITTED 状态只能由审批人操作
- APPROVED 状态的单据不可直接修改（需先撤回）
- 已下推到下游的单据不可撤回

### 3.2 业务状态机 - 销售订单
```
PENDING_SHIP (待出货)
    ↓ [部分出货]
PARTIAL_SHIP (部分出货)
    ↓ [全部出货]
FULLY_SHIPPED (出货完成)
    ↓ [关闭]
CLOSED (已关闭)
```

**规则:**
- 销售出货数量累计 >= 订单数量 → 自动变为 FULLY_SHIPPED
- 已关闭的订单不可再出货
- 退货不影响出货状态（走退货单流程）

### 3.3 业务状态机 - 生产订单
```
PENDING_ISSUE (待领料)
    ↓ [领料]
ISSUING (领料中)
    ↓ [开始生产]
IN_PRODUCTION (生产中)
    ↓ [完工报告]
PENDING_STOCK (待入库)
    ↓ [产品入库]
COMPLETED (已完成)
```

**规则:**
- 领料数量 >= BOM需求数量 → 可进入生产
- 完工报告审批通过 → 自动创建产品入库

### 3.4 业务状态机 - 入库单
```
PENDING (待收货)
    ↓ [确认收货]
RECEIVED (已收货)
    ↓ [质检完成/关闭]
CLOSED (已关闭)
```

### 3.5 业务状态机 - 出库单
```
PENDING (待发货)
    ↓ [确认发货]
SHIPPED (已发货)
    ↓ [关闭]
CLOSED (已关闭)
```

---

## 4. 下推(Push-Down)规则

### 4.1 下推时机
- 上游单据 APPROVED 后才可下推
- 下推可由用户手动触发或审批时自动触发

### 4.2 下推数量控制
```
下推数量 ≤ 上游数量 - 已下推累计数量
```

### 4.3 下推字段拷贝规则
| 源字段 | 目标字段 |
|---|---|
| 上游单号 | sourceNo (来源单号) |
| 上游类型 | sourceType |
| 物料信息 | 同名字段 |
| 客户/供应商 | 同名字段 |
| 项目信息 | projectId/Name |
| 数量 | quantity (可修改, 但不能超过上游未下推量) |

### 4.4 下推链完整清单
```
1. 报价单(APPROVED) → 分劈单 (标记结果=won 后)
2. 分劈单(APPROVED) → 销售订单
3. 销售订单(APPROVED) → 生产订单
4. 销售出货(APPROVED) → 出库单
5. 需求计划(APPROVED) → 采购计划
6. 采购计划(APPROVED) → 采购订单
7. 质检单(APPROVED, 合格品) → 入库单(合格品)
8. 制损单 → 采购计划 (物料补采购)
9. 到货确认 → 入库单
10. 盘点单(有差异) → 调整单
11. 报废申请(APPROVED) → 处置单
12. 完工报告(APPROVED) → 产品入库
```

---

## 5. 删除保护规则

### 5.1 禁止删除的情况
| 实体 | 禁止删除条件 |
|---|---|
| 物料 | 被 BOM/订单/出入库单 引用 |
| 客户 | 被 报价单/订单 引用 |
| 供应商 | 被 采购单/入库单 引用 |
| 仓库 | 被 库存记录 引用 (库存不为0) |
| 已审批订单 | approvalStatus = APPROVED |
| 已下推订单 | 存在下游单据引用 (sourceNo) |

### 5.2 级联规则
- 删除 DRAFT 订单: 直接删除
- 删除 SUBMITTED 订单: 先撤回, 再删除
- 删除 APPROVED 订单: 禁止 (需先撤回所有下游)

---

## 6. 库存操作规则

### 6.1 库存增加
| 触发操作 | 增加数量 | 条件 |
|---|---|---|
| 入库单审批 | quantity/qualifiedQty | approvalStatus→APPROVED |
| 退料单审批 | quantity | approvalStatus→APPROVED |
| 完工报告审批 | actualQty | approvalStatus→APPROVED |
| 调拨单审批(调入) | quantity | approvalStatus→APPROVED |
| 归还单 | quantity | actualReturn set |
| 调整单审批(盘盈) | \|diffQty\| | approvalStatus→APPROVED |

### 6.2 库存减少
| 触发操作 | 减少数量 | 条件 |
|---|---|---|
| 出库单审批 | quantity | approvalStatus→APPROVED |
| 领料单审批 | quantity | approvalStatus→APPROVED |
| 调拨单审批(调出) | quantity | approvalStatus→APPROVED |
| 报废单审批 | quantity | approvalStatus→APPROVED |
| 借出单审批 | quantity (仅锁定,总量不变) | availableQty↓, lockedQty↑ |
| 调整单审批(盘亏) | \|diffQty\| | approvalStatus→APPROVED |

### 6.3 库存不足校验
```
出库数量 ≤ 可用库存
领料数量 ≤ 可用库存
调拨数量 ≤ 调出仓可用库存
报废数量 ≤ 可用库存
借出数量 ≤ 可用库存
```

---

## 7. 成本核算规则

### 7.1 成本写入时机
每次库存变动(入库/出库/调拨/领料/退料/完工)审批通过时自动写入cost_ledger。

### 7.2 成本计算方法
- 入库成本 = quantity × unitPrice
- 出库成本 = quantity × 移动加权平均单价
- 调拨成本 = 0 (仅转移, 不产生成本)
- 领料成本 = quantity × 移动加权平均单价

### 7.3 移动加权平均单价
```
新单价 = (库存金额 + 入库金额) / (库存数量 + 入库数量)
出库金额 = 出库数量 × 当前移动加权平均单价
```

---

## 8. 质检业务规则

### 8.1 抽样规则
```
抽样数量 = 本次可质检数量 × 抽检比例 / 100
不合格比例 = 抽样不合格数量 / 抽样数量 × 100
```

### 8.2 判定规则
```
不合格比例 >= 不合格比例下限 → 整批不合格
不合格比例 < 不合格比例下限 → 合格(让步接收)
抽样合格数量 = 抽样数量 - 抽样不合格数量
总合格数量 = 本次可质检数量 - 总不合格品数量
```

### 8.3 质检后操作
```
质检通过 → [下推入库单] → 合格品入对应仓库
不合格品 → 生成不良品台账 → 走退供/报废流程
```

---

## 9. 表单字段交互逻辑

### 9.1 级联下拉
| 父字段 | 子字段 | 联动 |
|---|---|---|
| 仓库 | 储区 | 过滤该仓库下的储区 |
| 储区 | 通道 | 过滤该储区下的通道 |
| 通道 | 货架 | 过滤该通道下的货架 |
| 货架 | 货位 | 过滤该货架下的货位 |
| 物料分类 | 物料 | 过滤该分类下的物料 |
| 项目 | 合同 | 过滤该项目下的合同 |

### 9.2 自动填充
| 选择字段 | 自动填充 |
|---|---|
| 物料 | 规格型号, 计量单位, 默认仓库 |
| 客户 | 联系人, 电话, 地址 |
| 供应商 | 联系人, 电话 |
| BOM | 成品物料, 物料清单 |
| 项目 | 项目编码, 项目名称 |

### 9.3 默认值
| 字段 | 默认值 |
|---|---|
| status | ACTIVE |
| approvalStatus | DRAFT |
| sortOrder | 0 |
| 单据日期 | 当前日期 |
| 创建人 | 当前用户 |
| 创建日期 | 当前时间 |

---

## 10. 审批权限规则

### 10.1 审批人确定
- 提交审批时指定审批人(从部门负责人/指定审批人中选择)
- 或按组织架构自动匹配(上级部门负责人)

### 10.2 审批流
```
提交 → 审批人确认 → 通过/拒绝
      ↓
   可加签(多人审批)
```

### 10.3 撤回规则
- 仅 SUBMITTED 状态可撤回
- 撤回后状态回到 DRAFT
- 审批人已审批的不可撤回

---

## 11. 数据一致性规则

### 11.1 关联数据冗余更新
当以下字段更新时, 需要同步更新所有关联单据中的冗余字段:
- 物料名称变更 → 更新所有引用该物料的订单中的 materialName
- 客户名称变更 → 更新所有引用该客户的订单中的 customerName
- 仓库名称变更 → 更新所有出入库单中的 warehouseName

**实现方式:** Prisma 中间件监听 update, 批量更新关联表。

### 11.2 数量一致性
- 订单数量 = Σ 出货数量 + 未出货数量
- 入库数量 = Σ 上架数量
- 库存数量 = Σ 入库 - Σ 出库 + Σ 调整
- 生产订单数量 >= 领料数量
```

