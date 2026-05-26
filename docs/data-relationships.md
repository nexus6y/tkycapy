# 数据流转与实体关联 (AI 可读)

> 梳理所有模块间的实体引用关系、下推追溯、冗余字段策略
> 基于 Prisma Schema + 原系统表格提取 + 表单字段验证

---

## 1. 实体关联总图

```
                         ┌─────────────┐
                         │   Tenant    │ (多租户隔离)
                         └──────┬──────┘
                ┌───────────────┼───────────────┐
                │               │               │
    ┌───────────▼──┐  ┌────────▼───┐  ┌────────▼───┐
    │  系统管理     │  │  公共基础    │  │  业务模块    │
    │              │  │            │  │            │
    │ User ◄───────┼──┤ Material   │  │ SalesOrder │
    │  │           │  │  │         │  │  │         │
    │  ▼           │  │  ▼         │  │  ▼         │
    │ Department◄──┼──┤ Category  │  │ Customer  │
    │  │           │  │            │  │            │
    │  ▼           │  │ Project   │  │ Contract  │
    │ Role─────────┼──┤  │         │  │  │         │
    │  │           │  │  ▼         │  │  ▼         │
    │  ▼           │  │ Contract  │  │ Quotation │
    │ Menu─────────┼──┤            │  │  │         │
    │  │           │  │ Supplier  │  │  ▼         │
    │  ▼           │  │            │  │ PreOrder  │
    │ Permission   │  │ BOM       │  │  │         │
    └──────────────┘  └────────────┘  └─────┬──────┘
                                            │
              ┌─────────────────────────────┼─────────────┐
              │                             │             │
    ┌─────────▼──────┐  ┌──────────▼───┐  ┌▼──────────┐  │
    │   仓储管理       │  │   生产管理    │  │  采购管理  │  │
    │                │  │             │  │          │  │
    │ Area           │  │ BOM ◄───────┼──┤ Supplier │  │
    │  │             │  │  │          │  │  │       │  │
    │  ▼             │  │  ▼          │  │  ▼       │  │
    │ Warehouse◄─────┼──┤ ProductOrder│  │DemandPlan│  │
    │  │             │  │  │          │  │  │       │  │
    │  ▼             │  │  ▼          │  │  ▼       │  │
    │ Zone           │  │ Issue/Return│  │PurchOrder│  │
    │  │             │  │  │          │  │  │       │  │
    │  ▼             │  │  ▼          │  │  ▼       │  │
    │ Passage        │  │ Inspection │  │ Arrival  │  │
    │  │             │  │  │          │  │  │       │  │
    │  ▼             │  │  ▼          │  │  ▼       │  │
    │ Shelf          │  │ CostLedger │  │Inbound   │  │
    │  │             │  │            │  │  │       │  │
    │  ▼             │  └────────────┘  │  ▼       │  │
    │ Location       │                  │Inspection│  │
    │                │                  │  │       │  │
    │ InboundOrder◄──┼──────────────────┼──┘       │  │
    │ OutboundOrder  │                  │          │  │
    │ TransferOrder  │                  │PurchaseRet│  │
    │ LendOrder      │                  └──────────┘  │
    │ ScrapOrder     │                                │
    │ CheckOrder     │                                │
    │ Inventory      │                                │
    └────────────────┘                                │
                                                      │
    ┌─────────────────────────────────────────────────┘
    │
    ▼
  CostLedger (成本台账, 汇总所有库存交易)
```

---

## 2. 下推追溯链 (Push-Down Source Tracking)

### 2.1 销售链追溯

```
Quotation (报价单)
  quotationNo ──────────────┐
  customerId/Name           │ 下推时拷贝
  ↓                         │
PreOrder (分劈单)            │
  orderNo ──────────────────┤
  quotationNo (来源) ───────┘  ← 追溯字段
  contractId/Name
  customerId/Name
  ↓
SalesOrder (销售订单)
  orderNo
  preOrderNo (来源) ───→ 追溯分劈单
  contractId/Name
  customerId/Name
  projectId/Name
  ↓
SalesShipment (销售出货)
  shipmentNo
  orderId/No (来源) ──→ 追溯销售订单
  customerId/Name
  ↓
SalesReturn (销售退货)
  returnNo
  shipmentId/No (来源) ──→ 追溯出货单
```

### 2.2 采购链追溯

```
DemandPlan (需求计划)
  planNo
  projectId/Name
  ↓
PurchasePlan (采购计划)  
  planNo
  demandPlanNo (来源)
  ↓
PurchaseOrder (采购订单)
  orderNo
  purchasePlanNo (来源)
  supplierId/Name
  ↓
ArrivalConfirm (到货确认)
  └── 确认后触发入库流程
  ↓
InboundOrder (入库单)
  orderNo
  sourceType (来源类型: PURCHASE/INSPECTION)
  sourceNo (来源单号) ──→ 追溯采购订单
  sourceName (来源单据名称)
  sourceLineNo (来源行号)
  inspectionNo (质检单号) ──→ 追溯质检单
  supplierId/Name
  warehouseId/Name
  ↓
Inspection (质检单)
  inspectionNo
  sourceType: 采购单/生产退料单
  sourceNo (来源单号)
  sourceLineNo
  ↓
PurchaseReturn (退供单)
  returnNo
  orderId/No (来源) ──→ 追溯采购订单或入库单
```

### 2.3 生产链追溯

```
BOM (物料清单)
  code, name, version
  materialId/Name (成品)
  ↓
ProductionOrder (生产订单)
  orderNo
  bomId/Name (来源)
  materialId/Name (成品)
  departmentId/Name
  ↓
IssueOrder (领料单)
  issueNo
  productionOrderId/No (来源)
  materialId/Name
  ↓
ReturnOrder (退料单)
  returnNo
  productionOrderId/No (来源)
  materialId/Name
  ↓
CompleteReport (完工报告)
  productionOrderId/No (来源)
  ↓ ──审核通过──→
ProductInbound (产品入库)
  ↓ ──成本归集──→
CostLedger (成本台账)
```

### 2.4 仓储链追溯

```
InboundOrder (入库单)
  sourceType/sourceNo ─→ 追溯采购/质检/生产来源
  ↓
Inventory (库存)
  materialName, warehouseName, locationCode, batchNo
  quantity, availableQty, lockedQty
  ↓
OutboundOrder (出库单)
  sourceType/sourceNo ─→ 追溯销售出货/领料来源
  ↓
ScrapOrder (报废)
  sourceNo ─→ 追溯库存记录
  ↓
TransferOrder (调拨)
  orderNo (OUT/IN 成对)
  fromWarehouse → toWarehouse
  ↓
CheckOrder (盘点)
  生成调整单 → 调整库存
```

---

## 3. 冗余字段策略 (Denormalization)

原系统大量使用冗余字段存储关联实体的名称, 避免 JOIN 查询。

### 模式: `xxxId` + `xxxName` (双字段)

```
┌──────────────────────────────────────────────────────┐
│ 主键引用 (xxxId)        │ 冗余名称 (xxxName)          │
├──────────────────────────┼────────────────────────────┤
│ customerId               │ customerName               │
│ projectId                │ projectName                │
│ contractId               │ contractName               │
│ warehouseId              │ warehouseName              │
│ materialId               │ materialName               │
│ departmentId             │ departmentName             │
│ supplierId               │ supplierName               │
│ bomId                    │ bomName                    │
│ zoneId                   │ zoneName                   │
│ passageId                │ passageName                │
│ shelfId                  │ shelfName                  │
│ locationId               │ locationName               │
└──────────────────────────┴────────────────────────────┘
```

### 冗余更新策略
- 创建单据时: 从关联实体拷贝当前名称到 xxxName
- 关联实体改名时: 历史单据保留旧名称 (不级联更新)
- 显示时: 直接使用 xxxName, 无需 JOIN

---

## 4. 各模块实体引用清单

### 4.1 公共基础模块

```
Material (物料档案)
  ├── categoryId → MaterialCategory
  ├── unitId → MeasurementUnit
  └── defaultWarehouseId → Warehouse
       defaultDeptId → Department

MaterialCategory (物料分类)
  └── parentId → MaterialCategory (树形自引用)

Project (项目)
  └── (被 Contract, SalesOrder, PurchaseOrder 引用)

Contract (合同)
  ├── projectId → Project
  └── customerId → Customer
```

### 4.2 销售管理模块

```
Customer (客户档案)
  └── (被 Quotation, PreOrder, SalesOrder, SalesShipment, SalesReturn 引用)

Quotation (报价单)
  ├── customerId → Customer
  └── (被 PreOrder 下推引用)

PreOrder (分劈单)
  ├── customerId → Customer
  ├── contractId → Contract
  └── quotationId → Quotation

SalesOrder (销售订单)
  ├── customerId → Customer
  ├── contractId → Contract
  ├── projectId → Project
  └── preOrderId → PreOrder

SalesShipment (销售出货)
  ├── customerId → Customer
  ├── orderId → SalesOrder
  └── warehouseId → Warehouse

SalesReturn (销售退货)
  ├── customerId → Customer
  └── shipmentId → SalesShipment
```

### 4.3 采购管理模块

```
Supplier (供应商)
  └── (被 DemandPlan, PurchaseOrder, PurchaseReturn, Inspection 引用)

DemandPlan (需求计划)
  ├── projectId → Project
  └── (被 PurchasePlan 下推引用)

PurchaseOrder (采购订单)
  ├── supplierId → Supplier
  ├── projectId → Project
  └── purchasePlanId → PurchasePlan

PurchaseReturn (退供单)
  ├── supplierId → Supplier
  └── orderId → PurchaseOrder | InboundOrder
```

### 4.4 生产管理模块

```
BOM (物料清单)
  ├── materialId → Material (成品物料)
  └── (被 ProductionOrder 引用)

ProductionOrder (生产订单)
  ├── bomId → BOM
  ├── materialId → Material (成品)
  └── departmentId → Department

IssueOrder (领料单)
  ├── productionOrderId → ProductionOrder
  ├── materialId → Material
  └── departmentId → Department

ReturnOrder (退料单)
  ├── productionOrderId → ProductionOrder
  └── materialId → Material

Inspection (质检单)
  ├── materialId → Material
  ├── supplierId → Supplier (采购质检时)
  └── sourceNo → PurchaseOrder | ReturnOrder
```

### 4.5 仓储管理模块

```
层级关系: Area → Warehouse → Zone → Passage → Shelf → Location

Warehouse (仓库)
  └── areaId (隐式, 通过 Zone 链)

Zone (储区)
  └── warehouseId → Warehouse

Passage (通道)
  └── zoneId → Zone

Shelf (货架)
  └── passageId → Passage

Location (货位)
  └── shelfId → Shelf

InboundOrder (入库单)
  ├── warehouseId → Warehouse
  ├── supplierId → Supplier
  └── sourceNo → PurchaseOrder | Inspection | ProductionOrder

OutboundOrder (出库单)
  ├── warehouseId → Warehouse
  └── sourceNo → SalesShipment | IssueOrder

TransferOrder (调拨单)
  ├── fromWarehouse → Warehouse (名称, 非 FK)
  └── toWarehouse → Warehouse (名称, 非 FK)

LendOrder (借出单)
  └── (借用人, 无 FK 关联)

ScrapOrder (报废单)
  └── (物料+原因, 无 FK 关联)

CheckOrder (盘点单)
  ├── warehouseName → Warehouse (名称, 非 FK)
  └── zoneName → Zone (名称, 非 FK)

Inventory (库存)
  ├── warehouseId → Warehouse
  └── locationCode → Location (名称, 非 FK)
```

### 4.6 成本管理模块

```
CostLedger (成本台账)
  ├── transactionNo (交易单号)
  ├── transactionType: 入库/出库/调拨/调整
  ├── sourceNo → 来源单据 (InboundOrder/OutboundOrder/TransferOrder)
  ├── materialName → Material
  └── 每次库存交易写入一条成本记录
```

### 4.7 系统管理模块

```
User (用户)
  └── departmentId → Department

Role (角色)
  └── (UserRole 关联表)

Menu (菜单)
  └── parentId → Menu (树形自引用)

Permission (权限)
  ├── roleId → Role
  └── menuId → Menu

Department (部门)
  ├── parentId → Department (树形自引用)
  └── organizationId → Organization

Dictionary (字典)
  └── parentId → Dictionary (树形自引用)
```

---

## 5. 页面中的下拉选择数据源

创建/编辑表单中需要从其他实体拉取的下拉选项:

| 表单页面 | 下拉字段 | 数据源 API |
|---|---|---|
| 物料档案新增 | 物料分类 | GET /api/material-categories |
| 物料档案新增 | 计量单位 | GET /api/measurement-units |
| 销售订单新增 | 客户 | GET /api/customers |
| 销售订单新增 | 项目 | GET /api/projects |
| 销售订单新增 | 合同 | GET /api/contracts |
| 销售订单新增 | 分劈单 | GET /api/pre-orders?status=APPROVED |
| 采购订单新增 | 供应商 | GET /api/suppliers |
| 生产订单新增 | BOM | GET /api/boms?status=APPROVED |
| 生产订单新增 | 物料(成品) | GET /api/materials |
| 生产订单新增 | 部门 | GET /api/departments |
| 入库单新增 | 仓库 | GET /api/warehouses |
| 出库单新增 | 仓库 | GET /api/warehouses |
| 质检单新增 | 来源单号 | GET /api/purchase-orders?status=APPROVED |
| 储区新增 | 仓库 | GET /api/warehouses |
| 通道新增 | 储区 | GET /api/zones |
| 货架新增 | 通道 | GET /api/passages |
| 货位新增 | 货架 | GET /api/shelves |
| 退供单新增 | 采购订单 | GET /api/purchase-orders?status=APPROVED |
| 用户新增 | 部门 | GET /api/departments |
| 权限新增 | 角色 | GET /api/roles |
| 调出单新增 | 调出仓库 | GET /api/warehouses |
| 调出单新增 | 调入仓库 | GET /api/warehouses |

---

## 6. 缺失的关联字段 (待补充)

对比原系统, 当前 Prisma Schema 缺失以下引用字段:

### 高优先级
| 表 | 缺失字段 | 用途 |
|---|---|---|
| InboundOrder | sourceType, sourceNo, sourceLineNo | 追溯采购订单/质检单来源 |
| InboundOrder | inspectionNo | 关联质检单 |
| InboundOrder | supplierId, supplierName | 供应商追溯 |
| OutboundOrder | sourceType, sourceNo | 追溯销售出货单/领料单来源 |
| SalesOrder | preOrderId, preOrderNo | 追溯分劈单 |
| SalesOrder | quotationId, quotationNo | 追溯报价单 |
| ProductionOrder | bomId, bomName | BOM 引用 |

### 中优先级
| 表 | 缺失字段 | 用途 |
|---|---|---|
| SalesShipment | orderId, orderNo | 关联销售订单 |
| SalesReturn | shipmentId, shipmentNo | 关联出货单 |
| TransferOrder | fromWarehouseId, toWarehouseId | 仓库FK |
| PurchaseOrder | supplierId, projectId | 供应商/项目FK |
| LendOrder | warehouseId, warehouseName | 仓库引用 |
| ScrapOrder | warehouseId, warehouseName | 仓库引用 |
| CheckOrder | warehouseId, locationId | 仓库/货位FK |

### 低优先级 (冗余名称)
| 表 | 缺失字段 |
|---|---|
| TransferOrder | fromWarehouseName, toWarehouseName |
| LendOrder | materialName |
| ScrapOrder | materialName |
| IssueOrder | materialName, departmentName |
| ReturnOrder | materialName, departmentName |
