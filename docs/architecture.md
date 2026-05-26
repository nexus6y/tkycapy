# 生产制造管家 — 全局架构文件 (AI 可读)

> **用途**: 为系统前端复刻提供完整的技术架构、组件模式、路由结构和页面清单
> **截图根目录**: `/Users/cly/capy/screenshots/`
> **目标系统**: http://39.156.151.205:8081

---

## 1. 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vue 3 (Composition API, SPA) |
| UI 组件库 | **Element UI** (el-table, el-form, el-dialog, el-pagination...) |
| 图标 | **Ant Design Icons** + Element Icons (混用) |
| 路由 | Vue Router (history mode) |
| 状态管理 | Vuex (推测) |
| HTTP | Axios |
| 样式 | SCSS + Element UI 主题变量 |
| 构建 | Webpack (vue-cli) |

---

## 2. 全局布局架构

```
┌──────────────────────────────────────────────────┐
│  NAVBAR (horizontal, fixed, h=50px)               │
│  [折叠按钮] [面包屑导航]     [语言▾] [搜索] [用户▾] │
├────────┬─────────────────────────────────────────┤
│SIDEBAR │  TAGS-VIEW (多标签页栏)                   │
│        │  [工作台] [物料分类] [项目维护] ...        │
│ 全部    ├─────────────────────────────────────────┤
│ 10模块  │  MAIN CONTENT AREA                       │
│ 在一个   │  ┌─ 搜索区域 (el-form--inline) ────────┐ │
│ 树中    │  │ [搜索条件] [搜索] [重置] [展开▾]     │ │
│        │  │ [常用搜索方案▾]                       │ │
│(el-menu │  └─────────────────────────────────────┘ │
│ 垂直    │  ┌─ 操作栏 ─────────────────────────────┐ │
│ 树,     │  │ [新增] [修改] [删除] [提交] [撤回]... │ │
│ 含37个  │  └─────────────────────────────────────┘ │
│ el-sub  │  ┌─ 数据表格 (el-table, border) ───────┐ │
│ -menu   │  │ ☐ │列1│列2│列3│...│操作            │ │
│ 分组)   │  │ ☐ │...│...│...│...│[修改][删除]    │ │
│        │  └─────────────────────────────────────┘ │
│        │  ┌─ 分页 (el-pagination) ───────────────┐ │
│        │  │ [1] [2] [3] ... 共 N 条               │ │
│w=220px │  └─────────────────────────────────────┘ │
└────────┴─────────────────────────────────────────┘
│    首次访问弹出 THEME DRAWER (右侧抽屉, 主题风格设置)  │
└──────────────────────────────────────────────────────┘
```

### 关键尺寸
- 视口: 1200×668 (默认)
- 侧边栏: ~220px
- 顶栏: ~50px
- Tags-View: ~34px

---

## 3. 导航系统

### 3.1 菜单机制

系统采用**单一侧边栏菜单树**，所有 10 个业务模块（约 105 个叶子节点）在同一个 `el-menu` 垂直树中，通过 37 个 `el-submenu` 实现多级展开/折叠：

```
侧边栏 (el-menu, mode=vertical)
├── 工作台
├── 公共基础 (el-submenu)
│   ├── 物料管理 (el-submenu)
│   │   ├── 物料分类       ← el-menu-item (叶子)
│   │   ├── 物料参数
│   │   ├── 物料档案
│   │   └── 物料审批
│   ├── 项目管理 (el-submenu)
│   └── 合同管理 (el-submenu)
├── 销售管理 (el-submenu)
│   ├── 客户档案
│   ├── ...
│   └── 销售查询 (el-submenu)
├── ... (其余 7 个模块)
└── 系统管理 (el-submenu)
```

- 当前激活的菜单项高亮（`is-active` class）
- 含子菜单的分组通过箭头图标展开/折叠
- 页面切换时自动展开当前页面所属的父级菜单

### 3.2 完整菜单树 (105 个叶子节点)

```
01. 工作台
    └── 工作台 (/index)

02. 公共基础
    ├── 物料管理
    │   ├── 物料分类  (/publicFoundation/materialAdministration/materialClassification)
    │   ├── 物料参数  (/publicFoundation/materialAdministration/materialParams)
    │   ├── 物料档案  (/publicFoundation/materialAdministration/materialArchives)
    │   └── 物料审批  (/publicFoundation/materialAdministration/materialApproval)
    ├── 项目管理
    │   ├── 项目维护  (/projectManagement/projectManager)
    │   └── 项目查询  (/projectManagement/projectManagerQuery)
    └── 合同管理
        ├── 合同维护  (/contract/contractManagement)
        ├── 合同参数  (/contract/contractParameter)
        └── 合同查询  (/contract/contractManagementQuery)

03. 销售管理
    ├── 客户档案      (/saleManage/customerProfile)
    ├── 销售参数      (/saleManage/saleParameter)
    ├── 报价单维护    (/saleManage/quotationOrder)
    ├── 分劈单维护    (/saleManage/preOrder)
    ├── 销售订单维护  (/saleManage/saleOrder)
    ├── 销售出货维护  (/saleManage/saleShipmentMaintain)
    ├── 销售退货维护  (/saleManage/salesReturn)
    ├── 销售执行追溯  (/saleManage/salesTracing)
    └── 销售查询
        ├── 报价单查询    (/saleManage/saleQuery/quotationOrderQuery)
        ├── 分劈单查询    (/saleManage/saleQuery/preOrderQuery)
        ├── 销售订单查询  (/saleManage/saleQuery/saleOrderQuery)
        ├── 销售出货查询  (/saleManage/saleQuery/saleShipmentMaintainQuery)
        └── 销售退货查询  (/saleManage/saleQuery/salesReturnQuery)

04. 运营管理
    └── 运营需求
        ├── 需求计划维护  (/demandManagement/operationManagement/requirementPlanMaintenance)
        └── 需求计划查询  (/demandManagement/operationManagement/requirementPlanMaintenanceQuery)

05. 采购管理
    ├── 供应商档案      (/purchasingManagement/supplier)
    ├── 采购参数        (/purchasingManagement/purchaseParameter)
    ├── 采购计划维护    (/purchasingManagement/purchasePlan)
    ├── 采购订单维护    (/purchasingManagement/purchaseOrder)
    ├── 退供单维护      (/purchasingManagement/purchaseReturn)
    ├── 采购合同追溯    (/purchasingManagement/purchaseTracing)
    └── 采购查询
        ├── 采购计划查询  (/purchasingManagement/purchaseQuery/purchasePlanQuery)
        ├── 采购订单查询  (/purchasingManagement/purchaseQuery/purchaseOrderQuery)
        └── 退供单查询    (/purchasingManagement/purchaseQuery/purchaseReturnQuery)

06. 质量管理
    ├── 质检参数      (/qualityAssurance/qualityParams)
    ├── 质检单维护    (/qualityAssurance/qualityTesting)
    ├── 不良品台账    (/qualityAssurance/qualityDefective)
    └── 质检单查询    (/qualityAssurance/qualityTestingQuery)

07. 标准生产
    ├── 制造基础
    │   ├── BOM管理
    │   │   ├── BOM维护       (/productionManufacture/manufacturingFundamentals/bom/BOMAdministration)
    │   │   └── BOM差异分析   (/productionManufacture/manufacturingFundamentals/bom/BOManalysis)
    │   └── 工艺管理
    │       ├── 标准工序      (/productionManufacture/.../standardProcess)
    │       └── 工艺路线      (/productionManufacture/.../processRoute)
    └── 生产管理
        ├── 生产订单工作台    (/productionManufacture/productionManagement/productionOrder)
        ├── 生产变更          (/productionManufacture/productionManagement/productionChange)
        ├── 领料单维护        (/productionManufacture/productionManagement/productionReceive)
        ├── 退料单维护        (/productionManufacture/productionManagement/productionRejected)
        ├── 领料全追溯        (/productionManufacture/productionManagement/productionReviewQuery)
        ├── 完工报告审核      (/productionManufacture/productionManagement/productionReport)
        ├── 制损单审核        (/productionManufacture/productionManagement/productionDamage)
        └── 生产查询
            ├── 生产订单工作台查询  (/.../productionOrderQuery)
            ├── 领料单查询          (/.../productionReceiveQuery)
            └── 退料单查询          (/.../productionRejectedQuery)

08. 仓储管理
    ├── 仓储基础
    │   ├── 地区          (/warehouseManage/warehousFundamentals/area)
    │   ├── 仓库          (/warehouseManage/warehousFundamentals/warehouse)
    │   ├── 储区          (/warehouseManage/warehousFundamentals/storageArea)
    │   ├── 通道          (/warehouseManage/warehousFundamentals/passageway)
    │   ├── 货架          (/warehouseManage/warehousFundamentals/frame)
    │   ├── 货位          (/warehouseManage/warehousFundamentals/goodsPosition)
    │   └── 物料存储关系  (/warehouseManage/warehousFundamentals/materialStorage)
    ├── 入库管理
    │   ├── 到货确认      (/warehouseManage/warehousing/arrivedGoodsConfirm)
    │   ├── 入库单维护    (/warehouseManage/warehousing/inventoryMaintenance)
    │   ├── 入库单查询    (/warehouseManage/warehousing/inventoryMaintenanceQuery)
    │   └── 上架明细查询  (/warehouseManage/warehousing/inventoryMaintenanceDetail)
    ├── 出库管理
    │   ├── 出库单维护    (/warehouseManage/outbound/outboundMaintenance)
    │   ├── 出库单查询    (/warehouseManage/outbound/outboundMaintenanceQuery)
    │   └── 下架明细查询  (/warehouseManage/outbound/outboundMaintenanceDetail)
    ├── 库存管理
    │   ├── 库存查询      (/warehouseManage/inventoryManage/inventoryQuery)
    │   ├── 盘点单维护    (/warehouseManage/inventoryManage/inventorySheetMaintenance)
    │   ├── 批次号查询    (/warehouseManage/inventoryManage/batchNoQuery)
    │   ├── 盘点单查询    (/warehouseManage/inventoryManage/checkQuery)
    │   ├── 调整单审核    (/warehouseManage/inventoryManage/adjustFormReview)
    │   └── 调整单查询    (/warehouseManage/inventoryManage/adjustQuery)
    ├── 调拨管理
    │   ├── 调出单维护    (/warehouseManage/transferManagement/warehouseTransfer/transferOutOrder)
    │   ├── 调入单维护    (/warehouseManage/transferManagement/warehouseTransfer/transferInOrder)
    │   ├── 调出单查询    (/warehouseManage/transferManagement/warehouseTransfer/transferOutOrderQuery)
    │   └── 调入单查询    (/warehouseManage/transferManagement/warehouseTransfer/transferInOrderQuery)
    ├── 报废管理
    │   ├── 报废申请      (/warehouseManage/scrapManage/scrapApply)
    │   ├── 报废处置      (/warehouseManage/scrapManage/scrapHandle)
    │   ├── 报废台账      (/warehouseManage/scrapManage/scrapLedger)
    │   └── 报废查询      (/warehouseManage/scrapManage/scrapApplyQuery)
    └── 借还管理
        ├── 借出单维护    (/warehouseManage/warehousBorrowReturn/lendOrder)
        ├── 归还单维护    (/warehouseManage/warehousBorrowReturn/returnOrder)
        ├── 借出单查询    (/warehouseManage/warehousBorrowReturn/lendOrderQuery)
        └── 归还单查询    (/warehouseManage/warehousBorrowReturn/returnOrderQuery)

09. 成本管理
    └── 存货核算
        ├── 存货结转
        │   ├── 结转维护  (/businessFinanceManagement/calculateManagement/baseSetting/accountantMaintain)
        │   └── 结转订单  (/businessFinanceManagement/calculateManagement/baseSetting/accountantIncomplete)
        ├── 采购事务
        │   ├── 采购入库  (/businessFinanceManagement/calculateManagement/procureAffairs/procure)
        │   └── 采购退供  (/businessFinanceManagement/calculateManagement/procureAffairs/procurementReturn)
        ├── 库存事务
        │   ├── 库存      (/businessFinanceManagement/calculateManagement/inventoryAffairs/inventory)
        │   └── 台账      (/businessFinanceManagement/calculateManagement/inventoryAffairs/ledger)
        ├── 生产事务
        │   └── 产品入库  (/businessFinanceManagement/calculateManagement/produceAffairs/produce)
        └── 基础设置
            └── 核算期间  (/businessFinanceManagement/businessFinanceBase/accountantCycle)

10. 系统管理
    ├── 组织机构      (/sys/dept)
    ├── 用户管理      (/sys/user)
    ├── 角色管理      (/sys/role)
    ├── 菜单管理      (/sys/menu)
    ├── 权限分配      (/sys/acl/aclOpt)
    ├── 权限综合查询  (/sys/acl/aclQuerys)
    ├── 字典管理      (/sys/dict)
    ├── 流程设计      (/sys/flow/processDesign)
    ├── 登录日志      (/sys/log/login)
    ├── 操作日志      (/sys/log/operate)
    ├── 单据规则      (/sys/billsRule)
    ├── 国际化管理    (/sys/i18n)
    └── 打印管理      (/sys/print)
```

---

## 4. 页面类型与模板

### 类型A: 仪表盘 (Dashboard)
- **路径**: /index
- **截图**: `01_工作台/`
- **组成**:
  - 欢迎区: 用户问候 + 统计卡片 (待审核/我的发起/已审核) + 日历
  - 右侧面板: 常用功能、通知消息 (el-empty 空态)、操作帮助
  - 首次访问弹出「主题风格设置」抽屉
- **交互**: 语言切换下拉菜单、用户下拉菜单、日历翻页

### 类型B: 数据列表页 (Data List) — 占比 ~70%
- **路径模式**: `/module/submodule/entityName`
- **场景**: 客户档案、采购订单、入库单、盘点单、BOM维护...
- **布局**:
  ```
  [搜索区域]  ← 可折叠 (高级搜索)
  [操作栏]    ← [新增] [修改] [删除] [导入] [导出] [更多操作▼]
  [表格]      ← el-table + 多选 + 排序 + 行内操作 ([修改] [删除])
  [分页]      ← el-pagination
  ```
- **搜索区域结构**:
  - 默认显示一行常用搜索条件 (el-form--inline, 3-4 个 el-input/el-select)
  - 「展开」按钮 → 显示高级搜索面板 (多行条件 + 「搜索」「重置」「保存搜索方案」)
- **操作栏按钮排列**:
  - `[新增]` — el-button type=primary, 左侧
  - `[修改]` — el-button, 需先选中行
  - `[删除]` — el-button, 需先选中行
  - `[导入]` — el-button (仅部分页面)
  - `[导出]` — el-button (仅部分页面)
  - `[更多操作▼]` — el-dropdown (批改、批量审批等)
- **表格列**:
  - 第一列: 多选框 (type=selection)
  - 最后两列: 创建时间、修改时间
  - 末列: 操作列 ([修改] [删除] 文本按钮)
  - 表头可筛选/排序
- **截图**: 页面xxx.png + xxx_新增.png + xxx_新增_校验.png + xxx_搜索展开.png

### 类型C: 表单页 (Form Page) — 新增/编辑跳转
- **路径模式**: `/module/submodule/entityNameOperate?type=create` 或 `?type=update`
- **场景**: 点击[新增]/[修改] 后跳转到的独立页面
- **布局**:
  ```
  [面包屑导航]
  [表单区域]  ← el-form, label-width=120px, 多组 fieldset
    ├── 基本信息区
    │   ├── el-input (文本/数字)
    │   ├── el-select (下拉选择)
    │   ├── el-date-picker (日期)
    │   └── el-radio-group (单选)
    ├── 明细区 (可选)
    │   └── 嵌套 el-table + [添加行] [删除行]
    └── 附件区 (可选)
  [底部操作栏]  ← [提交] [保存草稿] [关闭]
  ```
- **校验**: 必填项红色星号, 空提交显示 el-form-item__error

### 类型D: 查询页 (Query/Report)
- **路径模式**: `/module/...Query`
- **与列表页区别**: 无[新增]/[修改]/[删除]按钮, 可能有[导出]
- **典型页面**: 项目查询、合同查询、各种查询页

### 类型E: 审核/追溯页
- **场景**: 完工报告审核、制损单审核、领料全追溯、调整单审核
- **特点**: 表格 + 详情展开/联查, 操作列有[审核]/[导出]等

### 类型F: 配置/参数页
- **场景**: 物料参数、销售参数、采购参数、质检参数、核算期间
- **特点**: 表单布局 (非表格), [保存] 按钮

---

## 5. 通用 UI 组件模式

### 5.1 按钮 (el-button)
```
type=primary    → 主要操作 (新增, 提交, 搜索, 保存配置)
type=default    → 次要操作 (重置, 取消, 关闭)
type=text       → 文本按钮 (表格行内的 修改/删除)
type=danger     → 危险操作 (删除确认)
size=small      → 表格内操作按钮
size=mini       → 紧凑场景
icon            → 带图标按钮
```

### 5.2 弹窗 (el-dialog)
- 触发: 部分新增操作 (用户管理)
- 结构: 标题栏 + 表单内容 (el-form) + 底部 [确定] [取消]
- 宽度: ~520px

### 5.3 抽屉 (el-drawer)
- 场景1: 系统主题设置 (右侧, size=300px)
- 场景2: 系统帮助 (右侧, width=300px)
- 带遮罩层 (click to close)

### 5.4 表格 (el-table)
- 特性: border, stripe, highlight-current-row
- 列配置对话框: 自定义显示/隐藏列 → `列表配置` 按钮
- 空态: el-empty (暂无数据)

### 5.5 分页 (el-pagination)
- 位置: 表格下方, 右对齐
- 功能: 页码、每页条数 (10/20/50/100)、总数显示、跳页

### 5.6 标签页 (el-tabs)
- 场景: 部分页面顶部有 Tab 切换 (如: 全部/待审核/已审核)
- 样式: el-tabs--border-card

### 5.7 搜索方案
- 「常用搜索方案」下拉: 保存/加载搜索条件组合
- 「高级搜索」: 展开更多筛选字段
- 「重置」: 清空所有条件

---

## 6. 状态与交互模式

### 6.1 新增流程
```
列表页 → 点击[新增] → 跳转表单页(?type=create) 或 弹出Dialog/Drawer
       → 填写表单 → 点击[提交] → 校验
         ├─ 校验失败 → 字段标红, 显示错误提示
         └─ 校验通过 → POST → 返回列表页, 刷新表格
```

### 6.2 编辑流程
```
列表页 → 选中行 → 点击[修改] → 跳转表单页(?type=update)
       或 → 点击行内[修改] → 同上
       → 表单回显数据 → 修改 → [提交]
```

### 6.3 删除流程
```
列表页 → 选中行 → 点击[删除] → MessageBox 确认
       → 确认 → DELETE → 刷新表格
```

### 6.4 审批流程
```
列表页 → 行内[提交审批] → 状态变为"审批中"
审核页 → [审核通过]/[审核拒绝] → 状态更新
```

### 6.5 导出
```
列表页 → [导出] → GET /api/.../export → 下载 Excel
```

---

## 7. 截图 → 页面映射表

### 文件夹结构 (164 张)

```
screenshots/
├── 01_工作台/ (3)
│   工作台_首页.png                 — 仪表盘全页
│   工作台_语言切换.png             — 语言下拉菜单展开
│   工作台_用户下拉菜单.png         — 用户头像下拉菜单
│
├── 02_公共基础/ (17)
│   公共基础_菜单展开.png           — 顶部菜单hover展开
│   公共基础_侧边栏展开.png         — 侧边栏完整树
│   公共基础_子菜单.png             — 子菜单hover
│   公共基础_物料分类.png           — 列表页
│   公共基础_物料分类_新增弹窗.png  — 新增页面(A类)
│   公共基础_物料分类_新增表单.png  — 新增表单全页
│   公共基础_物料参数.png           — 表单配置页(F类)
│   公共基础_物料档案.png           — 列表页(B类)
│   公共基础_物料档案_新增.png      — 新增表单
│   公共基础_物料档案_新增_校验错误.png — 校验失败态
│   公共基础_物料档案_高级搜索展开.png — 高级搜索展开
│   公共基础_物料审批.png           — 审批列表页
│   项目管理_项目维护.png           — 列表页
│   项目管理_项目查询.png           — 查询页(D类)
│   合同管理_合同维护.png           — 列表页
│   合同参数.png                   — 配置页(F类)
│   合同查询.png                   — 查询页
│
├── 03_销售管理/ (23)
│   销售管理_客户档案.png           — 列表页
│   销售参数.png                   — 配置页
│   报价单维护.png                 — 列表页 + 新增 + 校验 + 搜索展开
│   分劈单维护.png                 — 列表页
│   销售管理_销售订单维护.png       — 列表页
│   销售管理_销售订单维护_高级搜索展开.png
│   销售出货维护.png               — 列表页 + 新增 + 校验 + 搜索
│   销售退货维护.png               — 列表页 + 新增 + 校验 + 搜索
│   销售执行追溯.png               — 追溯页(E类)
│   报价单查询.png                 — 查询页
│   分劈单查询.png                 — 查询页
│   销售订单查询.png               — 查询页
│   销售出货查询.png               — 查询页
│   销售退货查询.png               — 查询页
│
├── 04_运营管理/ (2)
│   运营管理_需求计划维护.png       — 列表页
│   需求计划查询.png               — 查询页
│
├── 05_采购管理/ (17)
│   采购管理_供应商档案.png         — 列表页
│   采购参数.png                   — 配置页
│   采购计划维护.png               — 列表页 + 新增 + 校验 + 搜索
│   采购管理_采购订单维护.png       — 列表页
│   退供单维护.png                 — 列表页 + 新增 + 校验 + 搜索
│   采购合同追溯.png               — 追溯页
│   采购计划查询.png               — 查询页
│   采购订单查询.png               — 查询页
│   退供单查询.png                 — 查询页
│   采购入库.png                   — 列表页
│   采购退供.png                   — 列表页
│
├── 06_质量管理/ (4)
│   质检参数.png                   — 配置页
│   质量管理_质检单维护.png         — 列表页
│   不良品台账.png                 — 台账页
│   质检单查询.png                 — 查询页
│
├── 07_标准生产/ (20)
│   标准生产_BOM维护.png            — 列表页
│   BOM差异分析.png                — 分析页
│   标准工序.png                   — 列表页
│   工艺路线.png                   — 列表页
│   标准生产_生产订单工作台.png     — 工作台页
│   生产变更.png                   — 列表页
│   领料单维护.png                 — 列表页 + 新增 + 校验 + 搜索
│   退料单维护.png                 — 列表页 + 新增 + 搜索
│   领料全追溯.png                 — 追溯页
│   完工报告审核.png               — 审核页
│   制损单审核.png                 — 审核页 + 搜索展开
│   生产订单工作台查询.png         — 查询页
│   领料单查询.png                 — 查询页
│   退料单查询.png                 — 查询页
│
├── 08_仓储管理/ (56)
│   【仓储基础】地区/仓库/储区/通道/货架/货位/物料存储关系 (7)
│   【入库管理】到货确认/入库单维护/入库单查询/上架明细查询 (5)
│   【出库管理】出库单维护/出库单查询/下架明细查询 (5)
│   【库存管理】库存查询/盘点单维护/批次号查询/盘点单查询/调整单审核/调整单查询 (7)
│   【调拨管理】调出单维护/调入单维护/调出单查询/调入单查询 (8)
│   【报废管理】报废申请/报废处置/报废台账/报废查询 (10)
│   【借还管理】借出单维护/归还单维护/借出单查询/归还单查询 (10)
│   (含 新增/校验/搜索展开 子截图)
│
├── 09_成本管理/ (5)
│   成本管理_结转维护.png           — 列表页
│   结转订单.png                   — 列表页
│   产品入库.png                   — 列表页
│   核算期间.png                   — 配置页
│   台账.png                       — 台账页
│
├── 10_系统管理/ (15)
│   组织机构.png                   — 树形列表
│   系统管理_用户管理.png           — 列表页
│   系统管理_用户管理_新增弹窗.png  — Dialog新增
│   系统管理_用户管理_新增弹窗_全页.png
│   系统管理_角色管理.png           — 列表页
│   菜单管理.png                   — 树形管理
│   权限分配.png                   — 权限矩阵
│   权限综合查询.png               — 查询页
│   字典管理.png                   — 列表页
│   流程设计.png                   — 流程设计器
│   登录日志.png                   — 日志列表
│   操作日志.png                   — 日志列表
│   单据规则.png                   — 编码规则列表
│   国际化管理.png                 — 多语言列表
│   打印管理.png                   — 模板列表
│
└── 99_通用交互/ (2)
    系统帮助_抽屉.png               — 右侧帮助抽屉
    修改密码_弹窗.png               — 密码修改Dialog
```

---

## 8. API 模式推断

基于路由和 CRUD 模式推断后端 API 风格：

```
GET    /api/{module}/{entity}/list        → 分页查询列表
GET    /api/{module}/{entity}/{id}         → 获取详情
POST   /api/{module}/{entity}              → 新增
PUT    /api/{module}/{entity}              → 修改
DELETE /api/{module}/{entity}/{id}         → 删除
POST   /api/{module}/{entity}/submit      → 提交审批
POST   /api/{module}/{entity}/audit       → 审核
GET    /api/{module}/{entity}/export      → 导出 Excel
POST   /api/{module}/{entity}/import      → 导入 Excel
GET    /api/{module}/{entity}/export/{id} → 单个导出
```

---

## 9. 鉴权与用户状态

- 登录路径: `/login?redirect=...`
- 登录方式: 用户名 + 密码 + 验证码
- 用户信息: 顶栏右上角显示 (如: 测试用户(001test))
- 角色权限: RBAC, 控制菜单可见性和操作权限
- 当前测试账号: `001test / Gyl@2025` (部分模块可能受限)

---

## 10. 复刻优先级建议

| 优先级 | 页面类型 | 数量 | 原因 |
|---|---|---|---|
| P0 | 布局框架 (Layout) | 1 | 所有页面共享的壳 |
| P0 | 数据列表页模板 | 1 | 复用度最高 (~70%) |
| P0 | 表单页模板 | 1 | 新增/编辑复用 |
| P1 | 仪表盘 | 1 | 首页 |
| P1 | 查询页模板 | 1 | 纯查询变体 |
| P2 | 各模块列表页 | ~50 | 按模块逐步搭建 |
| P2 | 各模块表单页 | ~30 | 按模块逐步搭建 |
| P3 | 审核/追溯/配置页 | ~20 | 特殊页面 |

---

## 11. 已知差异与限制

以下 Excel 清单中的模块在当前用户权限下不可见（可能需管理员账号）:
- 用料申请维护/查询
- 自研需求计划/查询
- 物料需求计划工作台/查询/例外信息
- 完工报告查询 (仅有「完工报告审核」)
- 生产参数
- 工序流转卡
- 出库单明细 (浏览器中为「出库单查询」)
- 存货参数
- 会计期间 (浏览器中为「核算期间」)
- 权限管理 (浏览器中拆分为「权限分配」+「权限综合查询」)
- 销售合同追溯 (浏览器中为「销售执行追溯」)
