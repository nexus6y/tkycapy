# 天开制造管家 — 业务流与状态机 (AI 可读)

> 从原系统 http://39.156.151.205:8081 逆向提取
> 测试账号: 001test / Gyl@2025

---

## 模块 01: 工作台 (Dashboard)

### 页面: 工作台 `/index`
- **类型**: A (仪表盘)
- **布局**: 左右两栏
- **左栏**:
  - 欢迎语 + 3 统计卡片: 待审核(黄色) / 我的发起(蓝色) / 已审核(绿色)
  - 日历: el-calendar, 月份切换, 今天按钮
- **右栏**:
  - 常用功能: el-carousel, 无数据时为空
  - 通知消息: 列表 + 查看更多, 空态 "暂无信息"
  - 操作帮助: 视频教程 + 技术支持电话

### 交互
- 首次访问弹出「主题风格设置」抽屉
- 统计卡片数字从后端实时查询
- 日历支持前后翻月

### API
```
GET /api/dashboard/stats → { pending, mySubmissions, reviewed }
```

---

## 模块 02: 公共基础

### 2.1 物料分类

#### 页面
- 列表: `/publicFoundation/materialAdministration/materialClassification`
- 新增: `.../materialClassificationOperate?type=create`
- 编辑: `.../materialClassificationOperate?type=update`

#### 数据模型
| 字段 | 类型 | 说明 |
|---|---|---|
| code | string | 分类编码, 必填, 唯一 |
| name | string | 分类名称, 必填 |
| parentId | string? | 上级分类ID |
| parentCode | string? | 上级分类编码 (冗余) |
| parentName | string? | 上级分类名称 (冗余) |
| sortOrder | int | 排序, 默认0 |
| status | enum | ACTIVE/INACTIVE |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 修改时间 |

#### 业务规则
- 新增时选择「是否新增下级分类」=是 → 显示上级分类下拉
- 删除前检查: 是否有下级分类 或 物料引用, 有则禁止删除
- 状态切换: 停用分类不影响已有物料引用

#### 搜索
- 默认: 状态(dropdown), 分类编码, 分类名称
- 高级: 展开更多, 常用搜索方案保存/加载
- 列筛选: 表头每列可筛选和重置

#### API
```
GET    /api/material-categories?page=&pageSize=&code=&name=&status=
POST   /api/material-categories
PUT    /api/material-categories/:id
DELETE /api/material-categories/:id
```

#### 状态机
```
ACTIVE ←→ INACTIVE (手动切换, 无审批)
```

---

### 2.2 物料参数

#### 页面: 配置页 (F类)
- 路径: `/publicFoundation/materialAdministration/materialParams`

#### 数据模型 (键值对)
| 字段 | 说明 |
|---|---|
| code | 参数编码 |
| name | 参数名称 |
| value | 参数值 |
| type | 参数类型 (TEXT/NUMBER/SELECT) |

#### 交互
- 表单布局 (非表格), 直接编辑
- [保存] 按钮提交全部参数

---

### 2.3 物料档案

#### 页面
- 列表: `/publicFoundation/materialAdministration/materialArchives`
- 新增/编辑: 独立表单页

#### 数据模型
| 字段 | 类型 | 说明 |
|---|---|---|
| code | string | 物料编码, 必填, 唯一 |
| name | string | 物料名称, 必填 |
| spec | string? | 规格型号 |
| externalCode | string? | 外部编码 |
| categoryId | string? | 物料分类ID |
| categoryName | string? | 分类名称 (冗余) |
| unit | string? | 计量单位 |
| unitPrice | decimal? | 参考单价 |
| status | enum | ACTIVE/INACTIVE |
| createdAt | datetime | |
| updatedAt | datetime | |

#### 业务规则
- 物料编码自动生成规则: 前缀+日期+序号
- 分类必选, 从物料分类树选择
- 删除前检查: 是否被 BOM/订单引用

#### 搜索 (高级搜索展开后)
- 状态, 物料编码, 物料名称, 规格型号, 物料分类
- 外部编码, 创建时间范围

#### API
```
GET    /api/materials?page=&pageSize=&code=&name=&status=&categoryId=
POST   /api/materials
PUT    /api/materials/:id
DELETE /api/materials/:id
```

---

### 2.4 物料审批

#### 页面
- 列表: `/publicFoundation/materialAdministration/materialApproval`
- 类型: E (审核页)

#### 数据模型 (审批记录)
| 字段 | 说明 |
|---|---|
| materialId | 物料ID |
| approvalStatus | DRAFT/SUBMITTED/APPROVED/REJECTED |
| submitterId | 提交人 |
| approverId | 审批人 |
| comment | 审批意见 |

#### 状态机
```
DRAFT → SUBMITTED (提交审批)
SUBMITTED → APPROVED (审批通过)
SUBMITTED → REJECTED (审批拒绝)
REJECTED → DRAFT (重新编辑)
```

---

### 2.5 项目管理

#### 页面
- 项目维护: `/projectManagement/projectManager`
- 项目查询: `/projectManagement/projectManagerQuery` (只读)

#### 数据模型
| 字段 | 说明 |
|---|---|
| code | 项目编码 |
| name | 项目名称 |
| description | 项目描述 |
| startDate | 开始日期 |
| endDate | 结束日期 |
| manager | 负责人 |
| status | ACTIVE/INACTIVE |
| approvalStatus | DRAFT/SUBMITTED/APPROVED/REJECTED |

#### 业务规则
- 项目维护页有 CRUD
- 项目查询页只读, 仅有导出按钮
- 项目可关联合同和订单

---

### 2.6 合同管理

#### 页面
- 合同维护: `/contract/contractManagement`
- 合同参数: `/contract/contractParameter` (F类配置页)
- 合同查询: `/contract/contractManagementQuery` (只读)

#### 数据模型
| 字段 | 说明 |
|---|---|
| code | 合同编码 |
| name | 合同名称 |
| type | 合同类型 |
| partyA | 甲方 |
| partyB | 乙方 |
| amount | 合同金额 |
| startDate | 开始日期 |
| endDate | 结束日期 |
| projectId | 关联项目 |
| approvalStatus | DRAFT/SUBMITTED/APPROVED/REJECTED |

#### 状态机
```
DRAFT → SUBMITTED → APPROVED
                   → REJECTED → DRAFT
APPROVED → 可关联销售订单/分劈单
```

---

## 模块 03: 销售管理

### 3.1 客户档案

#### 数据模型
| 字段 | 说明 |
|---|---|
| code | 客户编码 |
| name | 客户名称 |
| contactPerson | 联系人 |
| phone | 联系电话 |
| address | 地址 |
| status | ACTIVE/INACTIVE |
| createdAt | |

#### 业务规则
- 客户被订单引用后不可删除
- 客户编码唯一

---

### 3.2 销售参数

#### 类型: F (配置页)
- 销售单编码规则
- 默认税率
- 审批设置

---

### 3.3 报价单 → 分劈单 → 销售订单

#### 业务流程 (核心)
```
报价单(DRAFT) ──提交──→ 报价单(SUBMITTED)
                          ↓ 审批通过
                      报价单(APPROVED)
                          ↓ 生成
                      分劈单(DRAFT) ──提交──→ 分劈单(SUBMITTED)
                                                ↓ 审批通过
                                            分劈单(APPROVED)
                                                ↓ 生成
                                          销售订单(DRAFT)
                                                ↓ 提交审批
                                          销售订单(APPROVED)
                                                ↓
                                          销售出货单 → 仓库出库
```

#### 状态机
```
DRAFT → SUBMITTED → APPROVED → 下游单据
                  → REJECTED → DRAFT
```

#### 报价单字段
| 字段 | 说明 |
|---|---|
| quotationNo | 报价单号 |
| quotationName | 报价名称 |
| customerId/Name | 客户 |
| totalAmount | 报价金额 |
| approvalStatus | 审批状态 |
| createdAt | |

#### 分劈单字段 (从报价单分拆)
| 字段 | 说明 |
|---|---|
| orderNo | 分劈单号 |
| orderName | 分劈名称 |
| contractId/Name | 关联合同 |
| customerId/Name | 客户 |
| totalAmount | 金额 |
| approvalStatus | |

#### 销售订单 — 完整字段

| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| approvalStatus | 审批状态 | DRAFT/SUBMITTED/APPROVED/REJECTED |
| businessStatus | 业务状态 | PENDING_SHIP/待出货→PARTIAL_SHIP/部分出货→FULLY_SHIPPED/出货完成→CLOSED |
| createMethod | 创建方式 | 按合同/开始无合同 (两种创建渠道) |
| orderName | 订单名称 | |
| orderNo | 订单单号 | |
| orderType | 订单单别 | 普通订单/... |
| orgName | 所属组织 | |
| projectCode | 项目编码 | |
| projectName | 项目名称 | |
| contractCode | 合同编码 | 来自合同 |
| contractName | 合同名称 | |
| customerCode | 客户编码 | |
| customerName | 客户名称 | |
| deptName | 销售部门 | |
| salesManager | 销售负责人 | |
| orderDate | 单据日期 | |
| createdBy | 创建人 | |
| createdAt | 创建日期 | |
| remark | 备注 | |
| attachment | 附件 | |
| hasContract | 是否关联合同 | 是/否 |

#### 创建方式 (关键业务逻辑)
- **按合同**: 从已有合同关联生成, 自动带入合同/客户/项目信息
- **开始无合同**: 直接创建, 手动填写客户和物料信息

#### 工具栏操作
- [新增] [按合同] [开始无合同] — 三种创建入口
- [修改] [删除] — 基本 CRUD
- [提交] — 提交审批
- [撤回] — 撤回已提交的订单
- [流程查看] — 查看审批流程
- [打印] — 打印订单

---

### 3.4 销售出货维护

#### 数据模型
| 字段 | 说明 |
|---|---|
| shipmentNo | 出货单号 |
| orderId/No | 关联销售订单 |
| customerId/Name | 客户 |
| warehouseId/Name | 发货仓库 |
| quantity | 出货数量 |
| shipmentDate | 出货日期 |
| approvalStatus | DRAFT/SUBMITTED/APPROVED |

#### 业务规则
- 出货数量 ≤ 订单未出货数量
- 全部出货后订单状态 → FULLY_SHIPPED

---

### 3.5 销售退货维护

#### 数据模型
| 字段 | 说明 |
|---|---|
| returnNo | 退货单号 |
| shipmentId/No | 关联出货单 |
| customerId/Name | 客户 |
| quantity | 退货数量 |
| reason | 退货原因 |
| approvalStatus | |

---

### 3.6 销售执行追溯

#### 类型: E (追溯页)
- 查询某个销售订单的完整链路: 报价→分劈→订单→出货→退货
- 维度: 序号, 所属组织, **项目信息**(编码/名称), **客户信息**(编码/名称), **销售信息**(单号), **合同信息**
- 操作: [总览] [明细] — Tab 切换查看整体或详细
- 只读, 可导出

### 5.6 采购合同追溯

#### 类型: E (追溯页)
- 维度: 项目信息 → 供应商信息 → 合同信息 → 采购信息 → 质检信息 → 入库信息 → 退供信息
- 全链路视图: 合同→采购订单→质检→入库→退供
- 只读, 可导出

---

## 模块 04: 运营管理

### 需求计划

#### 页面
- 需求计划维护: 列表 + CRUD
- 需求计划查询: 只读

#### 数据模型
| 字段 | 说明 |
|---|---|
| planNo | 计划编号 |
| planName | 计划名称 |
| materialId/Name | 物料 |
| quantity | 需求数量 |
| requiredDate | 需求日期 |
| sourceType | 来源类型 (销售订单/预测) |
| approvalStatus | DRAFT/SUBMITTED/APPROVED |

#### 状态机
```
DRAFT → SUBMITTED → APPROVED
                  → REJECTED → DRAFT
APPROVED → 生成采购计划
```

---

## 模块 05: 采购管理

### 5.1 供应商档案

| 字段 | 说明 |
|---|---|
| code | 供应商编码 |
| name | 供应商名称 |
| contactPerson | 联系人 |
| phone | 电话 |
| status | ACTIVE/INACTIVE |

---

### 5.2 采购参数

- 编码规则, 默认税率, 审批设置

---

### 5.3 采购计划 → 采购订单 → 退供

#### 业务流程
```
需求计划(APPROVED) → 采购计划(DRAFT) → 采购订单(DRAFT)
                                       ↓
                                  采购订单(APPROVED)
                                       ↓
                                  到货确认 → 入库单 → 质检
                                       ↓
                                  退供单(如有问题)
```

#### 状态机
```
DRAFT → SUBMITTED → APPROVED → 关联入库
                  → REJECTED → DRAFT
```

---

## 模块 06: 质量管理

### 6.1 质检参数 (F类配置)

### 6.2 质检单维护

#### 质检单 — 完整字段

| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| approvalStatus | 审批状态 | 未提交 (5)/已通过 (9) — DRAFT/SUBMITTED/APPROVED |
| inspectionNo | 质检单号 | |
| sourceType | 质检来源 | 采购单/生产退料单 |
| sourceLineNo | 来源行号 | |
| batchNo | 批号 | |
| materialCode | 物料编码 | |
| materialName | 物料名称 | |
| spec | 规格型号 | |
| unit | 计量单位 | |
| sourceQty | 单据原量 | 来源单据的原始数量 |
| inspectableQty | 本次可质检数量 | |
| inspectionMethod | 质检方式 | 抽检/全检 |
| sampleRatio | 抽检比例 | % |
| sampleQty | 抽样数量 | |
| sampleQualified | 抽样合格数量 | |
| sampleUnqualified | 抽样不合格数量 | |
| unqualifiedRatio | 不合格比例 | % |
| unqualifiedRatioMin | 不合格比例下限 | |
| totalQualified | 总合格数量 | |
| totalUnqualified | 总不合格品数量 | |
| orgName | 所属组织 | |
| projectCode | 项目编码 | |
| projectName | 项目名称 | |
| supplierCode | 供应商编码 | (采购质检时) |
| supplierName | 供应商名称 | |
| inspector | 质检负责人 | |
| inspectionDate | 质检日期 | |

#### 操作流程
1. [新增] — 创建质检单, 关联采购单或生产退料单
2. [质检] — 填写质检结果 (抽样数量/合格/不合格)
3. 审批通过后 → [下推入库单] — 生成入库单
4. 不合格品 → 自动生成不良品台账记录

#### 业务规则
- 采购质检: 质检来源 = 采购单
- 生产质检: 质检来源 = 生产退料单
- 抽样数量 = 本次可质检数量 × 抽检比例
- 不合格比例 = 抽样不合格数量 / 抽样数量
- 不合格比例超过下限 → 整批不合格
- 质检通过 → 下推入库单 (自动创建入库单据)

---

### 6.3 不良品台账

- 记录所有质检不合格的物料
- 处置方式: 退货/让步接收/报废

---

## 模块 07: 标准生产

### 7.1 BOM 管理

#### BOM 维护
| 字段 | 说明 |
|---|---|
| code | BOM编码 |
| name | BOM名称 |
| materialId | 成品物料 |
| version | 版本号 |
| quantity | 成品数量 |
| approvalStatus | DRAFT/SUBMITTED/APPROVED |

#### BOM 差异分析
- 对比不同版本 BOM 的用料差异

---

### 7.2 工艺管理

#### 标准工序
| 字段 | 说明 |
|---|---|
| code | 工序编码 |
| name | 工序名称 |
| processType | 工序类型 |
| workCenter | 工作中心 |
| standardTime | 标准工时 |

#### 工艺路线
- 多个工序按顺序组合成路线
- 关联到 BOM

---

### 7.3 生产订单

#### 业务流程
```
BOM(APPROVED) + 销售订单 → 生产订单(DRAFT)
                              ↓ 提交
                          生产订单(SUBMITTED)
                              ↓ 审批
                          生产订单(APPROVED)
                              ↓
                         领料单 → 退料单
                              ↓
                         完工报告 → 审核
```

#### 生产订单 — 完整字段

| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| status | 状态 | 审批状态 + 业务状态组合 |
| orderNo | 生产编号 | |
| orderName | 生产名称 | |
| orgName | 所属组织 | |
| deptName | 生产部门 | |
| createdBy | 创建人 | |
| createdAt | 创建日期 | |
| remark | 备注 | |
| attachment | 附件 | |
| approvalStatus | (隐含) | DRAFT/SUBMITTED/APPROVED/REJECTED |
| businessStatus | (隐含) | PENDING_ISSUE→ISSUING→IN_PRODUCTION→PENDING_STOCK→COMPLETED |

#### 工具栏操作
- [业务引导] — 向导式创建, 选择 BOM→填写数量→生成生产订单
- [新增] [修改] [删除] — 基本 CRUD
- [提交] — 提交审批
- [更多操作▾] — 包含: 领料/退料/完工等操作

#### 状态机
```
审批状态: DRAFT → SUBMITTED → APPROVED/REJECTED
业务状态: PENDING_ISSUE → ISSUING → IN_PRODUCTION → PENDING_STOCK → COMPLETED
```

---

### 7.4 领料单

#### 数据模型
| 字段 | 说明 |
|---|---|
| issueNo | 领料单号 |
| productionOrderId | 生产订单ID |
| materialId/Name | 物料 |
| quantity | 领料数量 |
| departmentId | 领料部门 |
| issueDate | 领料日期 |
| approvalStatus | DRAFT/SUBMITTED/APPROVED |

#### 业务规则
- 领料数量 ≤ BOM 用量 × 生产数量
- 审批通过后 → 库存减少

---

### 7.5 退料单

#### 业务规则
- 退料数量 ≤ 已领料数量
- 审批通过后 → 库存增加

---

### 7.6 完工报告审核

#### 完整字段
| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| reportNo | 报告单号 | |
| sourceType | 报告来源 | 生产订单 |
| approvalStatus | 审批状态 | |
| orgName | 所属组织 | |
| prodOrderNo | 生产单号 | |
| deptName | 生产部门 | |
| materialCode/Name | 物料编码/名称 | |
| spec | 规格型号 | |
| unit | 计量单位 | |
| plannedQty | 预计生产数量 | 来自生产订单 |
| actualQty | 实际生产数量 | 实际完工数量 |

#### 操作流程
- 工具栏: [修改] [提交] [撤回] [流程查看] [导出]
- 关键指标: 实际生产数量 vs 预计生产数量
- 实际 < 预计 → 可能触发制损记录
- 审批通过 → 业务状态 → COMPLETED, 可生成产品入库

---

### 7.7 制损单审核 (→ 下推采购计划)

#### 完整字段
| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| approvalStatus | 审批状态 | |
| opinion | 处理意见 | |
| damageNo | 制损单号 | |
| materialCode/Name | 物料编码/名称 | 损坏物料 |
| spec | 规格型号 | |
| unit | 计量单位 | |
| orgName | 所属组织 | |
| sourceProdNo | 来源生产单号 | 追溯 |
| sourceIssueNo | 来源领料单号 | 追溯 |
| sourceOutNo | 来源领料出库单号 | 追溯 |
| sourceReturnNo | 来源退料单号 | 追溯 |

#### 关键流程: 下推采购计划
```
制损(物料损坏) → 需要补充物料
    ↓ [下推采购计划]
  生成采购计划(DRAFT) → 采购订单 → 入库
    ↓
  物料补充到库存 → 重新领料
```

**工具栏:** [业务引导] [提交] [撤回] [流程查看] **[下推采购计划]** [导出]
- **下推采购计划** → 自动生成采购计划, 将损坏物料纳入采购需求

#### 业务规则
- 记录生产过程中的损坏数量
- 制损数量从完工数量中扣除
- 损坏物料可触发采购补货 (下推采购计划)
- 完整追溯: 生产订单→领料→退料→制损

---

### 7.8 领料全追溯 (Production Review Query)

#### 完整字段
| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| orderNo | 生产编码 | |
| orderName | 生产名称 | |
| orgName | 所属组织 | |
| prodOrderNo | 生产单号 | |
| businessStatus | 生产单业务状态 | |
| productCode/Name | 产品编码/名称 | 成品 |
| isProduct | 是否成品 | |
| level | 阶次 | BOM层级 |
| materialCode/Name | 材料编码/名称 | |
| spec | 规格型号 | |
| unit | 计量单位 | |
| requiredDate | 需求日期 | |
| shortage | 缺料 | 是否缺料 |

- 查询某生产订单的完整领料/退料/用料记录
- 含 BOM 阶层展开
- 可查看每个阶层材料的需求和缺料情况
- 只读, 可导出

---

## 模块 08: 仓储管理

### 8.1 仓储基础 (层级关系)

```
地区(Area) → 仓库(Warehouse) → 储区(Zone) → 通道(Passage) → 货架(Shelf) → 货位(Location)
```

每个层级实体有: code, name, type, 上级引用, status(ACTIVE/INACTIVE), sortOrder

### 8.2 到货确认

#### 页面: `.../warehousing/arrivedGoodsConfirm`
- **类型**: E (确认页)
- **工具栏**: `到货详情`, `导出`, `打印`
- **行操作**: `正常到货` — 确认到货, 触发后续入库流程
- **说明**: 到货确认是采购订单→入库的中间环节, 确认后自动生成入库单待办

---

### 8.3 入库管理

#### 业务流程
```
到货确认 → 入库单(DRAFT) → 提交 → 审批 → 质检(如需要) → 完成入库 → 库存增加
```

#### 入库单字段
| 字段 | 说明 |
|---|---|
| orderNo | 入库单号 |
| materialName | 物料 |
| specification | 规格 |
| quantity | 数量 |
| qualifiedQty | 合格数量 |
| unqualifiedQty | 不合格数量 |
| warehouseName | 仓库 |
| unitPrice | 单价 |
| totalAmount | 金额 |
| approvalStatus | DRAFT/SUBMITTED/APPROVED |
| businessStatus | PENDING/待收货→RECEIVED/已收货→CLOSED |
| receiptDate | 收货日期 |

---

### 8.3 出库管理

#### 业务流程
```
销售出货单(APPROVED) → 出库单(DRAFT) → 提交 → 审批 → 下架 → 库存减少
```

#### 出库单字段
| 字段 | 说明 |
|---|---|
| orderNo | 出库单号 |
| materialName | 物料 |
| quantity | 数量 |
| warehouseName | 仓库 |
| unitPrice | 单价 |
| totalAmount | 金额 |
| approvalStatus | |
| businessStatus | PENDING/待发货→SHIPPED/已发货→CLOSED |
| shipmentDate | 发货日期 |

---

### 8.4 库存管理

#### 库存查询
| 字段 | 说明 |
|---|---|
| materialName | 物料 |
| warehouseName | 仓库 |
| locationCode | 库位 |
| batchNo | 批次号 |
| quantity | 库存数量 |
| availableQty | 可用数量 |
| lockedQty | 锁定数量 |

#### 盘点单 — 完整字段与流程

| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| checkResult | 盘点结果 | 盘盈(1)/盘亏/平账 |
| checkMethod | 盘点方式 | 明盘点/盲盘点 |
| hasStock | 是否有库存 | |
| locationCode | 货位编码 | |
| materialCode/Name | 物料编码/名称 | |
| spec | 规格型号 | |
| unit | 计量单位 | |
| batchNo | 批次号 | |
| stockQty | 库存数量 | 系统当前库存 |
| checkQty | 盘点数量 | 实际盘点 |
| diffQty | 差异数量 | 盘点-库存 |
| areaName | 地区 | |
| warehouseName | 仓库 | |
| zoneName | 储区 | |
| inspector | 盘点负责人 | |

**操作流程:** [新增] → [盘点] → 差异≠0 → [生成调整单] → 调整单审核 → 库存修正

#### 调整单审核
- 审核人确认差异, [通过] → 库存更新, [拒绝] → 返回重盘

---

### 8.5 调拨管理 — 完整字段

| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| approvalStatus | 审批状态 | DRAFT→SUBMITTED→APPROVED |
| businessStatus | 业务状态 | |
| orderNo | 调拨单号 | |
| orgName | 调出所属组织 | |
| projectCode/Name | 调出项目编码/名称 | 关联项目 |
| fromWarehouse | 调出仓库 | |
| deptName | 制单部门 | |
| creator | 制单人 | |
| orderDate | 单据日期 | |
| completeDate | 完成日期 | 调拨完成日期 |
| type | | OUT/IN |
- 调出单(OUT) + 调入单(IN) 成对
- 调出仓库减少, 调入仓库增加

---

### 8.6 报废管理 (三级流转: 申请→处置→台账)

#### 报废申请 → 报废处置 → 报废台账

```
ScrapApply (报废申请)
  orderNo, name, scrapReason, disposalMethod
  deptName, applicant, projectCode/Name
  approvalStatus: DRAFT → SUBMITTED → APPROVED
  [提交] [撤回] [流程查看]
       ↓ 审批通过
ScrapHandle (报废处置)
  handleNo, handleName, disposalMethod
  deptName, handler, businessStatus
  [提交] [撤回] [流程查看]
       ↓ 处置完成
ScrapLedger (报废台账) — 只读
  handleNo, materialCode/Name/Spec/Unit
  disposalQty, disposalFactory, unitPrice, totalAmount
  warehouseName, areaName, batchNo
  [导出]
```

#### 报废申请字段
| 字段 | 说明 |
|---|---|
| orderNo | 报废单号 |
| name | 报废名称 |
| scrapReason | 报废原因 (临期/损坏/过期) |
| disposalMethod | 建议处置方式 |
| deptName | 申请部门 |
| applicant | 申请人 |
| projectCode/Name | 项目编码/名称 |

#### 报废处置字段
| 字段 | 说明 |
|---|---|
| handleNo | 处置单号 |
| handleName | 处置名称 |
| disposalMethod | 处置方式 (退供/销毁/变卖) |
| deptName | 处置部门 |
| handler | 处置负责人 |
| approvalStatus | 审核状态 |
| businessStatus | 已处置完成/处置中 |

#### 报废台账字段
| 字段 | 说明 |
|---|---|
| handleNo | 处置单号 |
| materialCode/Name/Spec/Unit | 物料信息 |
| disposalQty | 处置数量 |
| disposalFactory | 处置厂家 |
| unitPrice | 单价(不含税) |
| totalAmount | 金额(元) |
| warehouseName | 仓库 |
| areaName | 地区 |
| batchNo | 批次号 |

---

### 8.7 借还管理

#### 借出单
| 字段 | 说明 |
|---|---|
| orderNo | 借出单号 |
| materialName | 物料 |
| quantity | 数量 |
| borrower | 借用人 |
| borrowDate | 借出日期 |
| expectedReturn | 预计归还日期 |
| actualReturn | 实际归还日期 |
| approvalStatus | |

#### 归还单
- 与借出单关联
- 归还后恢复可用库存

---

## 模块 09: 成本管理

### 存货核算

#### 结转维护 — 完整字段

| 字段 | 来源系统列名 | 说明 |
|---|---|---|
| orgName | 核算组织 | |
| periodCode | 期间编码 | |
| periodName | 期间名称 | |
| periodType | 期间类型 | 月/季/年 |
| periodNo | 期间号 | 第几期 |
| startDate | 期间开始时间 | |
| endDate | 期间结束时间 | |
| closeStatus | 封账状态 | 已封账/未封账 |
| carryStatus | 结账状态 | 已结转/未结转 |
| createdBy | 创建人 | |
| createdAt | 创建日期 | |
| createMethod | 创建方式 | |

**操作流程:**
- [新增] 创建会计期间
- [封账] — 关闭该期间, 禁止新增交易
- [取消封账] — 重新打开期间
- [结转] — 将本期成本余额结转到下期
- [操作日志] — 查看封账/结转操作记录

**结转规则:**
- 必须先封账才能结转
- 结转后不可取消封账
- 结转方向: 本期期末余额 → 下期期初余额

#### 采购入库 / 采购退供
- 记录采购入库和退供的成本
- 交易单号, 物料, 数量, 单价, 金额

#### 产品入库
- 记录生产完工入库的成本

#### 台账
- 所有库存成本交易的汇总查询

---

## 模块 10: 系统管理

### 10.1 组织机构 (部门)
- code, name, sortOrder, status(ACTIVE/INACTIVE)

### 10.2 用户管理
- username, name, password, email, phone, status
- 新增弹窗 (Dialog)

### 10.3 角色管理
- code, name, description, status
- RBAC 模型

### 10.4 菜单管理
- code, name, path, type(MENU/BUTTON), sortOrder
- 树形结构

### 10.5 权限分配
- permission, type(API/MENU), roleId
- 权限矩阵

### 10.6 字典管理
- code, name, value, type

### 10.7 登录日志
- username, ipAddress, browser, os, status(1成功/0失败), loginTime

### 10.8 操作日志
- username, moduleName, businessName, method, status, operatedAt

---

## 通用交互模式

### 列表页 (B型) 标准布局
```
┌─────────────────────────────────────────┐
│ [新增] [修改] [删除] [导入] [导出] ...    │ ← 操作栏
│                       [重置] [搜索]      │
├─────────────────────────────────────────┤
│ 状态[▼] 编码[___] 名称[___]  [展开▾]    │ ← 搜索区
│ [常用搜索方案▾]                          │
├─────────────────────────────────────────┤
│ ☐│状态│编码│名称│...│创建时间│操作       │ ← 表格
│ ☐│启用│001 │测试│...│04-16   │[修改][删除]│
├─────────────────────────────────────────┤
│ 共28条  [30条/页▾]  [1] [2] ... [>]     │ ← 分页
└─────────────────────────────────────────┘
```

### 表单页 (C型)
```
┌─────────────────────────────────────────┐
│ [←返回] 新增XXX          [取消] [保存]   │
├────┬────────────────────────────────────┤
│基  │ *编码: [________]                 │
│本  │ *名称: [________]                 │
│信  │ 状态: ○启用 ○停用                  │
│息  │                                    │
└────┴────────────────────────────────────┘
```

### 查询页 (D型)
- 与列表页相同布局, 但无 [新增][修改][删除]

### 审核/追溯页 (E型)
- 列表 + [通过][拒绝] 操作按钮
- 字段包含审批状态标签

### 配置页 (F型)
- 表单布局, 仅 [保存] 按钮
- 用于参数/编码规则/系统设置

---

## 关键业务概念

### 标记结果 (Quotation Won/Lost)
- 报价单有 `标记结果` 字段和操作
- 标记为 "won" (赢单) → 可下推生成分劈单
- 标记为 "lost" (丢单) → 流程终止, 归档
- 标记为 "pending" → 继续跟进

### 登卡 / 撤销登卡 (Inventory Card Registration)
- 入库单确认后需要 "登卡" 才正式产生库存记录
- "登卡" = 在库存卡片上登记入库
- "撤销登卡" = 取消登记, 库存回退
- 登卡后才能进行出库/调拨等操作

### 业务引导 (Production Wizard)
- 生产订单的向导式创建流程
- 步骤: 选择BOM → 填写数量 → 选部门 → 生成订单
- 自动计算物料需求 (BOM用量 × 生产数量)
- 可选自动生成领料单

### 下推校验规则
- 上游单据必须 APPROVED 状态
- 下推数量 ≤ 上游单据未下推数量
- 已全部下推的订单不可再下推
- 下推时带入来源追踪字段 (来源单号/行号)

### 编码规则
- 各类单据编码格式: 前缀+日期(yyyyMM)+流水号
- 物料: 外部编码 + 内部编码双编码体系
- 供应商/客户: 独立编码规则
- 合同: 按合同类型分别编码

---

## 各页面 workflow 按钮模式

### 审批流页面 (E类) 标准工具栏
```
[新增] [修改] [删除] [提交] [撤回] [流程查看] [打印]
```
代表页面: 报价单、分劈单、销售订单、采购订单、生产订单、
         领料单、退料单、借出单、归还单、需求计划

### 确认流页面
```
[到货详情] [导出] [打印]
行操作: [正常到货]
```
代表页面: 到货确认

### 审核流页面
```
[导出] [打印]
行操作: [通过] [拒绝]
```
代表页面: 完工报告审核、制损单审核、调整单审核

### 仓储操作流页面
```
[新增] [修改] [删除] [登卡] [撤销登卡] [导出] [打印]
```
代表页面: 入库单维护、出库单维护

### 配置页 (F类)
```
[保存]
```
代表页面: 物料参数、销售参数、采购参数、质检参数、核算期间

---

## 通用状态标签

| 标签 | 颜色 | 含义 |
|---|---|---|
| 草稿 | 灰色 #909399 | DRAFT |
| 已提交 | 蓝色 #409eff | SUBMITTED |
| 已通过 | 绿色 #67c23a | APPROVED |
| 已拒绝 | 红色 #f56c6c | REJECTED |
| 启用 | 绿色圆点 | ACTIVE |
| 停用 | 灰色圆点 | INACTIVE |

## 跨模块业务链路 (Push-Down Chains)

### 销售链路 (报价→分劈→订单→出货→退货)
```
                    ┌──[标记结果=won]──→ 可生成分劈单
  报价单(DRAFT)     │
    ↓ [提交]        │
  报价单(SUBMITTED) │
    ↓ [审批通过]     │
  报价单(APPROVED) ─┘
                    ↓ [生成/下推]
  分劈单(DRAFT) ──→ SUBMITTED ──→ APPROVED
                                      ↓ [下推]
  销售订单(DRAFT) ──→ SUBMITTED ──→ APPROVED
      ↑ 按合同创建                    ↓ [下推]
      └── 合同(APPROVED)        销售出货单(DRAFT)
                                      ↓ [提交→审批]
                                销售出货单(APPROVED)
                                      ↓ [下推/关联]
                                仓库出库单 ──→ 库存减少
                                      ↓ (如有退货)
                                销售退货单 ──→ 库存增加
```
**关键操作:**
- 报价单: `标记结果` (won/lost) → won 后可下推分劈单
- 销售订单: `按合同` / `开始无合同` 两种创建方式
- 行内操作: `明细` 查看详情, `修改` 修改草稿, `提交`/`撤回` 审批流程

### 采购链路 (需求→计划→订单→到货→入库→质检→退供)
```
  运营需求计划(APPROVED)
       ↓
  采购计划(DRAFT) ──→ SUBMITTED ──→ APPROVED
       ↓ [下推]
  采购订单(DRAFT) ──→ SUBMITTED ──→ APPROVED
       ↓ [关联]
  到货确认 ──→ 入库单(待质检)
       ↓
  质检单(DRAFT) ──→ SUBMITTED ──→ APPROVED
       ↓                              ↓
  [合格品] → 合格品入库            [不合格品] → 不良品台账
       ↓                              ↓
  入库单(完成)                    采购退供单
       ↓
  库存增加
```

**入库单 "登卡" 机制:**
- `登卡`: 确认入库, 创建库存卡片记录
- `撤销登卡`: 取消入库, 库存卡片失效
- 入库单分为: 合格品入库 / 不良品入库 (分仓库)
- 累计追踪: "合格品已生成入库单数量（累计）"/"本次合格品待入库数量"
- 来源追踪: `来源单号`/`来源单据名称`/`来源行号`/`质检单号`

### 生产链路 (BOM→订单→领料→退料→完工→制损→补采购)
```
  BOM(APPROVED) + 销售订单(APPROVED)
       ↓ [业务引导/向导]
  生产订单(DRAFT) ──→ SUBMITTED ──→ APPROVED
       ↓                              ↓
  领料单(DRAFT)                   领料单(SUBMITTED→APPROVED)
       ↓                              ↓ 库存减少
  退料单(如有多余物料)             退料单(SUBMITTED→APPROVED)
       ↓                              ↓ 库存增加
  完工报告(预计vs实际) ──→ 审核
       ↓
  产品入库 ──→ 库存增加 (成品)
       ↓ (如实际<预计, 有损坏)
  制损单(追溯: 生产→领料→退料) ──→ 审核
       ↓
       ├── 损坏数量从完工中扣除
       └── [下推采购计划] → 采购计划 → 采购订单 → 入库 → 补料
```
**关键闭环:** 制损 → 下推采购计划 → 重新采购物料 → 补到库存 → 可用于下次生产

**"业务引导" 向导:**
1. 选择 BOM (包含物料清单和工艺路线)
2. 输入生产数量
3. 系统自动计算所需物料用量
4. 选择生产部门和日期
5. 生成生产订单

### 仓储链路
```
  入库: 到货确认 → 入库单 → 上架 → 库存增加
  出库: 出货通知 → 出库单 → 下架 → 库存减少
  调拨: 调出单(OUT) + 调入单(IN) → 库存转移
  盘点: 盘点单 → [盘盈/盘亏] → 调整单审核 → 库存修正
  报废: 报废申请 → 报废处置 → 库存减少 → 报废台账
  借还: 借出单 → [归还] → 归还单 → 库存恢复
```

### 下推 (Push-Down) 机制说明

下推是指在业务链中, 上游单据审批通过后, 系统自动或手动生成下游单据的过程。

**下推时拷贝的字段 (以采购订单→入库单为例):**
| 源字段 | 目标字段 | 说明 |
|---|---|---|
| 采购订单号 | 来源单号 | 追溯 |
| 物料编码/名称/规格 | 同字段 | 物料信息 |
| 供应商 | 供应商 | 来源供应商 |
| 订单数量 | 单据原量 | 原始数量 |
| 项目编码/名称 | 同字段 | 项目关联 |

**下推校验规则:**
- 上游单据必须 APPROVED 状态
- 下推数量 ≤ 上游单据未下推数量 (防重复)
- 已全部下推的订单不可再下推

---

## 通用审批流程
```
DRAFT ──[提交]──→ SUBMITTED ──[通过]──→ APPROVED
   ↑                ↓                      ↓
   └──[重新编辑]── REJECTED ←──[拒绝]──────┘
```
