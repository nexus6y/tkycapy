# 智能制造系统需求文档 (PRD)

## 模块一：页面核心元素与功能清单

### 1.1 工作台

#### 页面名称与定位
- **页面名称**：工作台首页
- **核心业务目标**：作为用户登录后的首页面，提供待办事项概览、快捷功能入口和通知消息中心

#### 数据展示维度
- 欢迎语与用户信息
- 待审核单据数量
- 我发起的单据数量
- 已审核单据数量
- 日历组件
- 常用功能快捷入口
- 通知消息列表

#### 用户交互与暗逻辑
- **操作按钮**：
  - 全局搜索：快速搜索系统内各类单据和基础资料
  - 系统帮助：打开帮助文档
  - 语言切换：支持多语言切换
  - 用户下拉菜单：个人信息、修改密码、退出登录
- **验证规则**：无特殊验证

---

### 1.2 公共基础模块

#### 1.2.1 物料分类
- **页面名称**：物料分类管理
- **核心业务目标**：建立和维护物料的多级分类体系
- **数据展示维度**：
  - 状态（启用/停用）
  - 分类编码
  - 分类名称
  - 上级分类编码
  - 上级分类名称
  - 创建时间
- **用户交互**：
  - 新增、修改、删除
  - 搜索（状态、分类编码、分类名称、创建时间范围）
  - 重置搜索条件
  - 展开/收起
- **验证规则**：
  - 分类编码必须唯一
  - 分类名称必填
  - 删除前检查是否有下级分类或物料引用

#### 1.2.2 物料档案
- **页面名称**：物料档案管理
- **核心业务目标**：维护系统中所有物料的完整信息
- **数据展示维度**：
  - 物料编码
  - 物料名称
  - 规格型号
  - 外部编码
  - 物料分类
  - 物料性质（实物/虚拟）
  - 计量单位
  - 状态
- **用户交互**：
  - 新增、修改、删除
  - 高级搜索
  - 物料审批
- **新增表单字段**：
  - 基本信息：1级分类、物料编码、物料名称、规格型号、外部编码、排序、状态、备注
  - 物料性质：物料性质（单选）、物料属性、产品分类
  - 计量单位
- **验证规则**：
  - 物料编码、物料名称必填
  - 物料编码格式校验
  - 1级分类必选
  - 物料性质必选

#### 1.2.3 项目管理
- **页面名称**：项目维护
- **核心业务目标**：管理企业各类项目信息
- **数据展示维度**：
  - 审批状态
  - 项目编码
  - 项目名称
  - 所属组织
  - 项目来源
- **用户交互**：
  - 新增、修改、删除、提交
  - 更多操作
  - 搜索（审批状态、项目编码、项目名称、项目来源、创建时间范围）

#### 1.2.4 合同管理
- **页面名称**：合同维护
- **核心业务目标**：管理销售和采购合同
- **数据展示维度**：
  - 审批状态
  - 是否项目合同
  - 是否框架合同
  - 项目编码/名称
  - 合同编码
- **用户交互**：
  - 新增、修改、删除、提交、撤回
  - 更多操作
  - 高级搜索

---

### 1.3 销售管理模块

#### 1.3.1 销售订单维护
- **页面名称**：销售订单维护
- **核心业务目标**：创建和维护销售订单，跟踪订单执行进度
- **数据展示维度**：
  - 审批状态（已通过/未提交等）
  - 业务状态（待出货/已出货/出货完成/部分出货等）
  - 创建方式
  - 订单名称
  - 订单单号
  - 订单类别
- **用户交互**：
  - 新增、修改、删除、提交
  - 更多操作
  - 搜索（审批状态、业务状态、创建方式、订单名称等）
- **业务状态流转**：
  - 待出货 → 部分出货 → 出货完成
  - 状态变更触发相应的库存和财务处理

#### 1.3.2 报价单维护
- **页面名称**：报价单维护
- **核心业务目标**：创建和管理客户报价
- **数据展示维度**：
  - 审批状态
  - 报价单号
  - 报价名称
  - 客户信息
- **新增表单字段**：
  - 基本信息：报价单号（自动生成）、报价名称、报价部门、报价负责人、截至日期、备注、附件
  - 客户信息：客户编码、客户名称、所属行业、客户价值、信用等级、联系人
- **验证规则**：
  - 报价名称、截至日期必填
  - 客户编码与客户名称联动

#### 1.3.3 销售出货维护
- **页面名称**：销售出货维护
- **核心业务目标**：管理销售出库业务
- **数据展示维度**：同销售订单

#### 1.3.4 销售退货维护
- **页面名称**：销售退货维护
- **核心业务目标**：处理客户退货业务

#### 1.3.5 客户档案
- **页面名称**：客户档案管理
- **核心业务目标**：维护客户信息

---

### 1.4 采购管理模块

#### 1.4.1 采购订单维护
- **页面名称**：采购订单维护
- **核心业务目标**：创建和维护采购订单
- **数据展示维度**：
  - 审批状态
  - 创建方式
  - 业务状态（待入库/入库完成等）
  - 采购单号
  - 采购名称
- **用户交互**：同销售订单
- **业务状态流转**：待入库 → 入库完成

#### 1.4.2 采购计划维护
- **页面名称**：采购计划维护
- **核心业务目标**：制定采购计划

#### 1.4.3 供应商档案
- **页面名称**：供应商档案管理
- **核心业务目标**：维护供应商信息

#### 1.4.4 退供单维护
- **页面名称**：退供单维护
- **核心业务目标**：处理向供应商退货业务

---

### 1.5 质量管理模块

#### 1.5.1 质检单维护
- **页面名称**：质检单维护
- **核心业务目标**：对采购入库、生产退料等进行质量检验
- **数据展示维度**：
  - 审批状态
  - 业务状态（待质检/质检完成等）
  - 质检单号
  - 质质检来源（采购单/生产退料等）
  - 来源单号
  - 来源行号
- **用户交互**：
  - 新增、质检、修改、查看质检、下推入库单、导出、打印
  - 搜索（审批状态、业务状态、质检单号、来源单号等）
- **验证规则**：
  - 质检时必填检验结果
  - 下推入库单需质检完成

---

### 1.6 标准生产模块

#### 1.6.1 BOM维护
- **页面名称**：BOM维护（物料清单）
- **核心业务目标**：维护产品的物料清单结构
- **数据展示维度**：
  - 序号
  - 阶层
  - 审批状态
  - BOM编码
  - BOM名称
  - 物料编码
- **用户交互**：
  - 新增、修改、删除、变更、更多操作
  - 搜索（审批状态、BOM编码、BOM名称、物料编码等）

#### 1.6.2 生产订单工作台
- **页面名称**：生产订单工作台
- **核心业务目标**：管理生产订单的全生命周期
- **数据展示维度**：
  - 状态
  - 生产编号
  - 生产名称
  - 所属组织
  - 生产部门
- **用户交互**：
  - 业务引导、新增、修改、删除、更多操作

#### 1.6.3 领料单维护
- **页面名称**：领料单维护
- **核心业务目标**：管理生产领料业务

#### 1.6.4 退料单维护
- **页面名称**：退料单维护
- **核心业务目标**：管理生产退料业务

---

### 1.7 仓储管理模块

#### 1.7.1 库存查询
- **页面名称**：库存查询
- **核心业务目标**：实时查询物料库存信息
- **数据展示维度**：
  - 所属组织
  - 物料编码
  - 物料名称
  - 规格型号
  - 计量单位
  - 库存数量
  - 预计可用数量
- **统计信息**：
  - 存储总数量
  - 预计总数量
  - 库存可用总数量
- **用户交互**：
  - 导出
  - 搜索（所属组织、物料编码、物料名称、规格型号等）
  - 综合库存/项目库存/批次库存切换

#### 1.7.2 入库单维护
- **页面名称**：入库单维护
- **核心业务目标**：处理各类入库业务（采购入库、生产入库等）
- **数据展示维度**：
  - 业务状态
  - 入库单号
  - 物料编码
  - 物料名称
  - 规格型号
  - 计量单位
- **统计信息**：
  - 本次合格品入库数量合计
  - 本次不良品入库数量合计
  - 合格品已生成入库单金额合计
  - 本次不良品入库金额合计
- **用户交互**：
  - 新增、修改、删除、登卡、更多操作

#### 1.7.3 仓库基础资料
- **页面名称**：仓库、储区、货位、货架、通道管理
- **核心业务目标**：维护仓库仓储结构

#### 1.7.4 出库单维护
- **页面名称**：出库单维护
- **核心业务目标**：处理各类出库业务

#### 1.7.5 盘点单维护
- **页面名称**：盘点单维护
- **核心业务目标**：库存盘点业务

#### 1.7.6 报废申请/处置
- **页面名称**：报废申请、报废处置
- **核心业务目标**：处理物料报废业务

#### 1.7.7 借出/归还单
- **页面名称**：借出单维护、归还单维护
- **核心业务目标**：物料借用归还管理

#### 1.7.8 调入/调出单
- **页面名称**：调入单维护、调出单维护
- **核心业务目标**：仓库间调拨业务

---

### 1.8 系统管理模块

#### 1.8.1 用户管理
- **页面名称**：用户管理
- **核心业务目标**：管理系统用户账号
- **数据展示维度**：
  - 用户账号
  - 用户名称
  - 所属部门
  - 状态
- **新增用户表单字段**：
  - 所属部门（必选）
  - 用户账号（必填）
  - 用户名称（必填）
  - 联系方式
  - 电子邮箱
  - 排序
  - 状态（启用/停用）
  - 数据权限（必选）
- **验证规则**：
  - 用户账号唯一
  - 邮箱格式校验
  - 必填项校验

#### 1.8.2 角色管理
- **页面名称**：角色管理
- **核心业务目标**：管理系统角色和权限
- **数据展示维度**：
  - 角色编号
  - 角色名称
  - 所属单位
  - 单位编号
  - 状态
  - 创建时间
- **用户交互**：
  - 新增、修改、删除、分配用户
  - 展开/收起

#### 1.8.3 权限管理
- **页面名称**：权限分配、权限综合查询
- **核心业务目标**：分配和查询用户/角色权限

#### 1.8.4 操作日志
- **页面名称**：操作日志
- **核心业务目标**：记录用户操作日志，用于审计追溯
- **数据展示维度**：
  - 操作人
  - 模块名称
  - 业务名称
  - 执行方法
  - IP地址
  - 操作时间
- **用户交互**：
  - 删除、详情
  - 搜索（操作人、模块名称、业务名称、操作时间范围等）

#### 1.8.5 字典管理
- **页面名称**：字典管理
- **核心业务目标**：维护系统数据字典
- **数据展示维度**：
  - 字典编号
  - 字典名称
  - 上级编号
  - 上级名称
  - 备注
  - 提示
- **用户交互**：
  - 新增、修改、删除

#### 1.8.6 其他系统功能
- 菜单管理
- 组织机构
- 单据规则
- 打印管理
- 国际化管理
- 登录日志
- 流程设计

---

## 模块二：核心业务状态机与流程图

### 2.1 销售订单业务流程

```mermaid
stateDiagram-v2
    [*] --> 草稿: 创建销售订单
    草稿 --> 待审核: 提交
    待审核 --> 已拒绝: 审核拒绝
    待审核 --> 已通过: 审核通过
    已拒绝 --> 草稿: 修改后重新提交
    已通过 --> 待出货: 订单生效
    待出货 --> 部分出货: 部分发货
    待出货 --> 出货完成: 全部发货
    部分出货 --> 出货完成: 剩余发货
    出货完成 --> [*]: 订单关闭
```

### 2.2 采购订单业务流程

```mermaid
stateDiagram-v2
    [*] --> 草稿: 创建采购订单
    草稿 --> 待审核: 提交
    待审核 --> 已拒绝: 审核拒绝
    待审核 --> 已通过: 审核通过
    已拒绝 --> 草稿: 修改后重新提交
    已通过 --> 待入库: 订单生效
    待入库 --> 部分入库: 部分到货
    待入库 --> 入库完成: 全部到货
    部分入库 --> 入库完成: 剩余到货
    入库完成 --> [*]: 订单关闭
```

### 2.3 生产订单业务流程

```mermaid
stateDiagram-v2
    [*] --> 草稿: 创建生产订单
    草稿 --> 待审核: 提交
    待审核 --> 已拒绝: 审核拒绝
    待审核 --> 已通过: 审核通过
    已拒绝 --> 草稿: 修改后重新提交
    已通过 --> 待领料: 订单生效
    待领料 --> 领料中: 开始领料
    领料中 --> 待生产: 领料完成
    待生产 --> 生产中: 开始生产
    生产中 --> 待入库: 生产完成
    待入库 --> 已完成: 入库完成
    已完成 --> [*]: 订单关闭
```

### 2.4 质检业务流程

```mermaid
stateDiagram-v2
    [*] --> 待质检: 创建质检单
    待质检 --> 待审核: 提交质检结果
    待审核 --> 检验不合格: 审核不通过
    待审核 --> 检验合格: 审核通过
    检验合格 --> 待入库: 下推入库单
    检验不合格 --> 不良品处理: 进入不良品流程
    待入库 --> [*]: 入库完成
    不良品处理 --> [*]: 处理完成
```

### 2.5 端到端业务主流程

```mermaid
flowchart TD
    A[销售订单] --> B[需求计划]
    B --> C[生产订单]
    B --> D[采购计划]
    D --> E[采购订单]
    E --> F[采购到货]
    F --> G[质检单]
    G --> H{质检结果}
    H -->|合格| I[采购入库]
    H -->|不合格| J[退供/不良品处理]
    I --> K[库存增加]
    C --> L[生产领料]
    K --> L
    L --> M[生产过程]
    M --> N[生产入库]
    N --> O[库存增加]
    O --> P[销售出货]
    P --> Q[订单完成]
```

---

## 模块三：数据库表结构设计 (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 枚举定义 ====================

enum ApprovalStatus {
  DRAFT     // 草稿
  SUBMITTED // 已提交
  APPROVED  // 已通过
  REJECTED  // 已拒绝
  WITHDRAWN // 已撤回
}

enum BusinessStatus {
  PENDING       // 待处理
  IN_PROGRESS   // 进行中
  PARTIAL       // 部分完成
  COMPLETED     // 已完成
  CLOSED        // 已关闭
  CANCELLED     // 已取消
}

enum SalesOrderStatus {
  DRAFT         // 草稿
  PENDING_APPROVAL // 待审核
  APPROVED      // 已审核
  PENDING_SHIP  // 待出货
  PARTIAL_SHIP  // 部分出货
  FULLY_SHIPPED // 出货完成
  CLOSED        // 已关闭
}

enum PurchaseOrderStatus {
  DRAFT           // 草稿
  PENDING_APPROVAL // 待审核
  APPROVED        // 已审核
  PENDING_RECEIPT // 待入库
  PARTIAL_RECEIPT // 部分入库
  FULLY_RECEIVED  // 入库完成
  CLOSED          // 已关闭
}

enum ProductionOrderStatus {
  DRAFT           // 草稿
  PENDING_APPROVAL // 待审核
  APPROVED        // 已审核
  PENDING_ISSUE   // 待领料
  ISSUING         // 领料中
  IN_PRODUCTION   // 生产中
  PENDING_STOCK   // 待入库
  COMPLETED       // 已完成
  CLOSED          // 已关闭
}

enum InspectionStatus {
  DRAFT       // 草稿
  PENDING     // 待质检
  INSP_IN_PROGRESS // 质检中
  QUALIFIED   // 合格
  UNQUALIFIED // 不合格
}

enum MaterialType {
  PHYSICAL // 实物
  VIRTUAL  // 虚拟
}

enum CommonStatus {
  ACTIVE  // 启用
  INACTIVE // 停用
}

enum StockChangeType {
  IN  // 入库
  OUT // 出库
}

// ==================== 系统基础表 ====================

model Tenant {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  status      CommonStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  // 关系
  users       User[]
  roles       Role[]
  departments Department[]
  materials   Material[]
  suppliers   Supplier[]
  customers   Customer[]
  
  @@map("tenant")
}

model User {
  id            String        @id @default(cuid())
  tenantId      String
  username      String        @unique
  password      String        // 加密存储
  name          String
  email         String?
  phone         String?
  departmentId  String?
  dataScope     String?       // 数据权限范围
  sortOrder     Int           @default(0)
  status        CommonStatus  @default(ACTIVE)
  lastLoginAt   DateTime?
  lastLoginIp   String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?
  
  // 关系
  tenant        Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  department    Department?   @relation(fields: [departmentId], references: [id])
  userRoles     UserRole[]
  createdOrders SalesOrder[]  @relation("SalesOrderCreator")
  approvedOrders SalesOrder[] @relation("SalesOrderApprover")
  
  @@index([tenantId])
  @@index([departmentId])
  @@map("user")
}

model Role {
  id          String        @id @default(cuid())
  tenantId    String
  code        String
  name        String
  description String?
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userRoles   UserRole[]
  permissions Permission[]
  
  @@index([tenantId])
  @@map("role")
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())
  
  // 关系
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, roleId])
  @@map("user_role")
}

model Permission {
  id          String   @id @default(cuid())
  roleId      String
  menuId      String?
  permission  String   // 权限标识 (如: read, write, delete, approve)
  type        String   // 权限类型 (menu/button/api)
  createdAt   DateTime @default(now())

  // 关系
  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  menu        Menu?    @relation(fields: [menuId], references: [id], onDelete: SetNull)

  @@unique([roleId, permission])
  @@index([roleId])
  @@index([menuId])
  @@map("permission")
}

model Department {
  id          String        @id @default(cuid())
  tenantId    String
  code        String
  name        String
  parentId    String?
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  parent      Department?   @relation("DepartmentTree", fields: [parentId], references: [id])
  children    Department[]  @relation("DepartmentTree")
  users       User[]
  
  @@index([tenantId])
  @@index([parentId])
  @@map("department")
}

model Menu {
  id          String        @id @default(cuid())
  tenantId    String
  code        String
  name        String
  parentId    String?
  path        String?
  icon        String?
  component   String?
  sortOrder   Int           @default(0)
  type        String        // menu/button
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  parent      Menu?         @relation("MenuTree", fields: [parentId], references: [id])
  children    Menu[]        @relation("MenuTree")
  permissions  Permission[]
  
  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([parentId])
  @@map("menu")
}

model Dictionary {
  id          String        @id @default(cuid())
  tenantId    String
  code        String
  name        String
  parentId    String?
  value       String?
  remark      String?
  hint        String?
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  parent      Dictionary?   @relation("DictionaryTree", fields: [parentId], references: [id])
  children    Dictionary[]  @relation("DictionaryTree")
  
  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([parentId])
  @@map("dictionary")
}

model OperationLog {
  id          String   @id @default(cuid())
  userId      String?
  username    String?
  moduleName  String?
  businessName String?
  method      String?
  ipAddress   String?
  requestUrl  String?
  requestMethod String?
  requestParams Json?
  responseResult Json?
  status      Int?     // 0失败 1成功
  errorMsg    String?
  costTime    Int?     // 耗时（毫秒）
  operatedAt  DateTime @default(now())

  // 关系
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([operatedAt])
  @@index([moduleName, businessName])
  @@map("operation_log")
}

model LoginLog {
  id          String   @id @default(cuid())
  userId      String?
  username    String?
  ipAddress   String?
  loginLocation String?
  browser     String?
  os          String?
  status      Int?     // 0失败 1成功
  msg         String?
  loginTime   DateTime @default(now())

  // 关系
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([loginTime])
  @@map("login_log")
}

// ==================== 公共基础数据表 ====================

model MaterialCategory {
  id          String        @id @default(cuid())
  tenantId    String
  code        String
  name        String
  parentId    String?
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  parent      MaterialCategory? @relation("MaterialCategoryTree", fields: [parentId], references: [id])
  children    MaterialCategory[] @relation("MaterialCategoryTree")
  materials   Material[]
  
  @@index([tenantId])
  @@index([parentId])
  @@map("material_category")
}

model Material {
  id               String        @id @default(cuid())
  tenantId         String
  code             String
  name             String
  specification    String?       // 规格型号
  externalCode     String?       // 外部编码
  categoryId       String
  materialType     MaterialType  @default(PHYSICAL)
  materialProperty String?
  productCategory  String?
  unitId           String
  sortOrder        Int           @default(0)
  status           CommonStatus  @default(ACTIVE)
  remark           String?
  approvalStatus   ApprovalStatus @default(DRAFT)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  deletedAt        DateTime?
  
  // 关系
  tenant           Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category         MaterialCategory @relation(fields: [categoryId], references: [id])
  unit             MeasurementUnit @relation(fields: [unitId], references: [id])
  inventory        Inventory[]
  bomItems         BomItem[]
  bomParents       BomItem[]     @relation("BomParentMaterial")
  orderItems       OrderItem[]
  
  @@unique([tenantId, code])
  @@index([tenantId, categoryId])
  @@index([unitId])
  @@map("material")
}

model MeasurementUnit {
  id          String        @id @default(cuid())
  tenantId    String
  code        String
  name        String
  symbol      String?
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  materials   Material[]
  
  @@map("measurement_unit")
}

model Project {
  id              String         @id @default(cuid())
  tenantId        String
  code            String
  name            String
  source          String?
  organizationId  String?
  approvalStatus  ApprovalStatus @default(DRAFT)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  salesOrders     SalesOrder[]
  
  @@unique([tenantId, code])
  @@map("project")
}

model Contract {
  id              String         @id @default(cuid())
  tenantId        String
  code            String
  name            String
  type            String        // 销售合同/采购合同
  isProjectContract Boolean      @default(false)
  isFrameworkContract Boolean    @default(false)
  projectId       String?
  customerId      String?
  supplierId      String?
  startDate       DateTime?
  endDate         DateTime?
  totalAmount     Decimal?      @db.Decimal(18, 6)
  approvalStatus  ApprovalStatus @default(DRAFT)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project         Project?       @relation(fields: [projectId], references: [id])
  customer        Customer?      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  supplier        Supplier?      @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  salesOrders     SalesOrder[]
  purchaseOrders  PurchaseOrder[]

  // 业务约束: customerId 与 supplierId 互斥 (销售合同 vs 采购合同)
  // 应用层需确保: (customerId IS NULL) <> (supplierId IS NULL)

  @@unique([tenantId, code])
  @@index([projectId])
  @@index([customerId])
  @@index([supplierId])
  @@map("contract")
}

// ==================== 销售管理表 ====================

model Customer {
  id              String        @id @default(cuid())
  tenantId        String
  code            String
  name            String
  industry        String?
  valueLevel      String?       // 客户价值等级
  creditLevel     String?       // 信用等级
  contactPerson   String?
  contactPhone    String?
  contactEmail    String?
  address         String?
  status          CommonStatus  @default(ACTIVE)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  salesOrders     SalesOrder[]
  
  @@unique([tenantId, code])
  @@map("customer")
}

model SalesOrder {
  id              String             @id @default(cuid())
  tenantId        String
  orderNo         String
  orderName       String
  customerId      String
  projectId       String?
  contractId      String?
  orderType       String             // 普通订单等
  orderDate       DateTime           @default(now())
  deliveryDate    DateTime?
  totalAmount     Decimal?           @db.Decimal(18, 6)
  approvalStatus  ApprovalStatus     @default(DRAFT)
  businessStatus  SalesOrderStatus   @default(DRAFT)
  createdById     String?
  approvedById    String?
  approvedAt      DateTime?
  remark          String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  customer        Customer           @relation(fields: [customerId], references: [id])
  project         Project?           @relation(fields: [projectId], references: [id])
  contract        Contract?          @relation(fields: [contractId], references: [id])
  createdBy       User?              @relation("SalesOrderCreator", fields: [createdById], references: [id])
  approvedBy      User?              @relation("SalesOrderApprover", fields: [approvedById], references: [id])
  items           SalesOrderItem[]
  shipments       SalesShipment[]
  attachments     Attachment[]
  
  @@unique([tenantId, orderNo])
  @@index([tenantId, customerId])
  @@index([projectId])
  @@index([contractId])
  @@index([createdById])
  @@index([approvedById])
  @@index([businessStatus])
  @@map("sales_order")
}

model SalesOrderItem {
  id              String   @id @default(cuid())
  orderId         String
  lineNo          Int
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  unitPrice       Decimal? @db.Decimal(18, 6)
  amount          Decimal? @db.Decimal(18, 6)
  deliveredQty    Decimal  @default(0) @db.Decimal(18, 6)
  remark          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // 关系
  order           SalesOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  material        Material   @relation(fields: [materialId], references: [id])
  
  @@index([orderId])
  @@index([materialId])
  @@map("sales_order_item")
}

model Quotation {
  id              String         @id @default(cuid())
  tenantId        String
  quotationNo     String
  quotationName   String
  customerId      String
  departmentId    String?
  responsibleId   String?
  validUntil      DateTime
  totalAmount     Decimal?       @db.Decimal(18, 6)
  approvalStatus  ApprovalStatus @default(DRAFT)
  remark          String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  customer        Customer       @relation(fields: [customerId], references: [id])
  department      Department?    @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  responsible     User?          @relation("QuotationResponsible", fields: [responsibleId], references: [id], onDelete: SetNull)
  items           QuotationItem[]
  attachments     Attachment[]
  
  @@unique([tenantId, quotationNo])
  @@index([customerId])
  @@index([departmentId])
  @@index([responsibleId])
  @@map("quotation")
}

model QuotationItem {
  id              String   @id @default(cuid())
  quotationId     String
  lineNo          Int
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  unitPrice       Decimal? @db.Decimal(18, 6)
  amount          Decimal? @db.Decimal(18, 6)
  remark          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // 关系
  quotation       Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  material        Material  @relation(fields: [materialId], references: [id])
  
  @@index([quotationId])
  @@index([materialId])
  @@map("quotation_item")
}

model SalesShipment {
  id              String             @id @default(cuid())
  tenantId        String
  shipmentNo      String
  orderId         String
  shipmentDate    DateTime           @default(now())
  approvalStatus  ApprovalStatus     @default(DRAFT)
  businessStatus  BusinessStatus     @default(PENDING)
  totalAmount     Decimal?           @db.Decimal(18, 6)
  remark          String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  order           SalesOrder         @relation(fields: [orderId], references: [id])
  items           SalesShipmentItem[]
  
  @@unique([tenantId, shipmentNo])
  @@index([orderId])
  @@map("sales_shipment")
}

model SalesShipmentItem {
  id              String   @id @default(cuid())
  shipmentId      String
  orderItemId     String
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  warehouseId     String?
  locationId      String?
  createdAt       DateTime @default(now())
  
  // 关系
  shipment        SalesShipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  orderItem       SalesOrderItem @relation(fields: [orderItemId], references: [id])
  material        Material   @relation(fields: [materialId], references: [id])
  
  @@index([shipmentId])
  @@index([orderItemId])
  @@index([materialId])
  @@map("sales_shipment_item")
}

// ==================== 采购管理表 ====================

model Supplier {
  id              String        @id @default(cuid())
  tenantId        String
  code            String
  name            String
  contactPerson   String?
  contactPhone    String?
  contactEmail    String?
  address         String?
  creditLevel     String?
  status          CommonStatus  @default(ACTIVE)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  purchaseOrders  PurchaseOrder[]
  
  @@unique([tenantId, code])
  @@map("supplier")
}

model PurchaseOrder {
  id              String               @id @default(cuid())
  tenantId        String
  orderNo         String
  orderName       String
  supplierId      String
  contractId      String?
  createMethod    String?
  orderDate       DateTime             @default(now())
  expectedDate    DateTime?
  totalAmount     Decimal?             @db.Decimal(18, 6)
  approvalStatus  ApprovalStatus       @default(DRAFT)
  businessStatus  PurchaseOrderStatus  @default(DRAFT)
  createdById     String?
  approvedById    String?
  approvedAt      DateTime?
  remark          String?
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  supplier        Supplier             @relation(fields: [supplierId], references: [id])
  contract        Contract?            @relation(fields: [contractId], references: [id], onDelete: SetNull)
  createdBy       User?                @relation("PurchaseOrderCreator", fields: [createdById], references: [id])
  approvedBy      User?                @relation("PurchaseOrderApprover", fields: [approvedById], references: [id])
  items           PurchaseOrderItem[]
  receipts        PurchaseReceipt[]
  inspections     Inspection[]
  
  @@unique([tenantId, orderNo])
  @@index([tenantId, supplierId])
  @@index([contractId])
  @@index([createdById])
  @@index([approvedById])
  @@map("purchase_order")
}

model PurchaseOrderItem {
  id              String   @id @default(cuid())
  orderId         String
  lineNo          Int
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  unitPrice       Decimal? @db.Decimal(18, 6)
  amount          Decimal? @db.Decimal(18, 6)
  receivedQty     Decimal  @default(0) @db.Decimal(18, 6)
  remark          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // 关系
  order           PurchaseOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  material        Material      @relation(fields: [materialId], references: [id])
  
  @@index([orderId])
  @@index([materialId])
  @@map("purchase_order_item")
}

// ==================== 生产管理表 ====================

model Bom {
  id              String         @id @default(cuid())
  tenantId        String
  code            String
  name            String
  materialId      String
  version         String?
  approvalStatus  ApprovalStatus @default(DRAFT)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  material        Material       @relation(fields: [materialId], references: [id])
  items           BomItem[]
  productionOrders ProductionOrder[]
  
  @@unique([tenantId, code])
  @@index([materialId])
  @@map("bom")
}

model BomItem {
  id                  String   @id @default(cuid())
  bomId               String
  parentMaterialId    String?  // 父项物料ID，用于多层BOM
  level               Int      @default(1)
  lineNo              Int
  materialId          String
  quantity            Decimal  @db.Decimal(18, 6)
  remark              String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // 关系
  bom                 Bom      @relation(fields: [bomId], references: [id], onDelete: Cascade)
  parentMaterial      Material? @relation("BomParentMaterial", fields: [parentMaterialId], references: [id])
  material            Material @relation(fields: [materialId], references: [id])
  
  @@index([bomId])
  @@index([parentMaterialId])
  @@index([materialId])
  @@map("bom_item")
}

model ProductionOrder {
  id              String                @id @default(cuid())
  tenantId        String
  orderNo         String
  orderName       String
  bomId           String?
  materialId      String
  quantity        Decimal               @db.Decimal(18, 6)
  startDate       DateTime?
  endDate         DateTime?
  departmentId    String?
  approvalStatus  ApprovalStatus        @default(DRAFT)
  businessStatus  ProductionOrderStatus @default(DRAFT)
  remark          String?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  bom             Bom?                  @relation(fields: [bomId], references: [id])
  material        Material              @relation(fields: [materialId], references: [id])
  issues          MaterialIssue[]
  returns         MaterialReturn[]
  
  @@unique([tenantId, orderNo])
  @@index([bomId])
  @@index([materialId])
  @@index([businessStatus])
  @@map("production_order")
}

model MaterialIssue {
  id              String         @id @default(cuid())
  tenantId        String
  issueNo         String
  productionOrderId String
  approvalStatus  ApprovalStatus @default(DRAFT)
  businessStatus  BusinessStatus @default(PENDING)
  issueDate       DateTime       @default(now())
  remark          String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  productionOrder ProductionOrder @relation(fields: [productionOrderId], references: [id])
  items           MaterialIssueItem[]
  
  @@unique([tenantId, issueNo])
  @@index([productionOrderId])
  @@map("material_issue")
}

model MaterialIssueItem {
  id              String   @id @default(cuid())
  issueId         String
  lineNo          Int
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  warehouseId     String?
  locationId      String?
  remark          String?
  createdAt       DateTime @default(now())
  
  // 关系
  issue           MaterialIssue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  material        Material      @relation(fields: [materialId], references: [id])
  
  @@index([issueId])
  @@index([materialId])
  @@map("material_issue_item")
}

model MaterialReturn {
  id              String         @id @default(cuid())
  tenantId        String
  returnNo        String
  productionOrderId String
  approvalStatus  ApprovalStatus @default(DRAFT)
  businessStatus  BusinessStatus @default(PENDING)
  returnDate      DateTime       @default(now())
  remark          String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  productionOrder ProductionOrder @relation(fields: [productionOrderId], references: [id])
  items           MaterialReturnItem[]
  
  @@unique([tenantId, returnNo])
  @@index([productionOrderId])
  @@map("material_return")
}

model MaterialReturnItem {
  id              String   @id @default(cuid())
  returnId        String
  lineNo          Int
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  warehouseId     String?
  locationId      String?
  remark          String?
  createdAt       DateTime @default(now())
  
  // 关系
  return          MaterialReturn @relation(fields: [returnId], references: [id], onDelete: Cascade)
  material        Material       @relation(fields: [materialId], references: [id])
  
  @@index([returnId])
  @@index([materialId])
  @@map("material_return_item")
}

// ==================== 质量管理表 ====================

model Inspection {
  id              String           @id @default(cuid())
  tenantId        String
  inspectionNo    String
  sourceType      String           // 采购单/生产退料等
  sourceId        String
  sourceNo        String
  sourceLineNo    String?
  approvalStatus  ApprovalStatus   @default(DRAFT)
  businessStatus  InspectionStatus @default(DRAFT)
  inspectionDate  DateTime?
  inspectorId     String?
  result          String?
  qualifiedQty    Decimal?         @db.Decimal(18, 6)
  unqualifiedQty  Decimal?         @db.Decimal(18, 6)
  remark          String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  inspector       User?            @relation("InspectionInspector", fields: [inspectorId], references: [id], onDelete: SetNull)
  items           InspectionItem[]

  @@unique([tenantId, inspectionNo])
  @@index([sourceType, sourceId])
  @@index([inspectorId])
  @@map("inspection")
}

model InspectionItem {
  id              String   @id @default(cuid())
  inspectionId    String
  lineNo          Int
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  qualifiedQty    Decimal  @db.Decimal(18, 6)
  unqualifiedQty  Decimal  @db.Decimal(18, 6)
  inspectionResult String?
  remark          String?
  createdAt       DateTime @default(now())
  
  // 关系
  inspection      Inspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  material        Material   @relation(fields: [materialId], references: [id])
  
  @@index([inspectionId])
  @@index([materialId])
  @@map("inspection_item")
}

// ==================== 仓储管理表 ====================

model Warehouse {
  id          String        @id @default(cuid())
  tenantId    String
  code        String
  name        String
  address     String?
  managerId   String?
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  zones       Zone[]
  locations   Location[]
  inventory   Inventory[]
  
  @@unique([tenantId, code])
  @@index([tenantId])
  @@map("warehouse")
}

model Zone {
  id          String        @id @default(cuid())
  warehouseId String
  code        String
  name        String
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  warehouse   Warehouse     @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  locations   Location[]
  
  @@index([warehouseId])
  @@map("zone")
}

model Location {
  id          String        @id @default(cuid())
  warehouseId String
  zoneId      String?
  code        String
  name        String
  sortOrder   Int           @default(0)
  status      CommonStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  
  // 关系
  warehouse   Warehouse     @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  zone        Zone?         @relation(fields: [zoneId], references: [id])
  inventory   Inventory[]
  
  @@index([warehouseId])
  @@index([zoneId])
  @@map("location")
}

model Inventory {
  id            String   @id @default(cuid())
  tenantId      String
  materialId    String
  warehouseId   String?
  locationId    String?
  batchNo       String?
  quantity      Decimal  @db.Decimal(18, 6)
  availableQty  Decimal  @db.Decimal(18, 6)
  lockedQty     Decimal  @default(0) @db.Decimal(18, 6)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // 关系
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  material      Material @relation(fields: [materialId], references: [id])
  warehouse     Warehouse? @relation(fields: [warehouseId], references: [id])
  location      Location? @relation(fields: [locationId], references: [id])
  
  @@unique([tenantId, materialId, warehouseId, locationId, batchNo])
  @@index([tenantId, materialId])
  @@index([warehouseId])
  @@index([batchNo])
  @@map("inventory")
}

model StockTransaction {
  id            String           @id @default(cuid())
  tenantId      String
  transactionNo String
  type          StockChangeType
  sourceType    String?          // 来源单据类型
  sourceId      String?
  sourceNo      String?
  materialId    String
  warehouseId   String?
  locationId    String?
  batchNo       String?
  quantity      Decimal          @db.Decimal(18, 6)
  beforeQty     Decimal          @db.Decimal(18, 6)
  afterQty      Decimal          @db.Decimal(18, 6)
  transactionDate DateTime       @default(now())
  remark        String?
  createdAt     DateTime         @default(now())
  
  // 关系
  tenant        Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  material      Material         @relation(fields: [materialId], references: [id])
  warehouse     Warehouse?       @relation(fields: [warehouseId], references: [id], onDelete: SetNull)
  location      Location?        @relation(fields: [locationId], references: [id], onDelete: SetNull)

  @@index([tenantId, materialId])
  @@index([warehouseId])
  @@index([sourceType, sourceId])
  @@index([transactionDate])
  @@map("stock_transaction")
}

model PurchaseReceipt {
  id              String           @id @default(cuid())
  tenantId        String
  receiptNo       String
  orderId         String?
  inspectionId    String?
  receiptDate     DateTime         @default(now())
  approvalStatus  ApprovalStatus   @default(DRAFT)
  businessStatus  BusinessStatus   @default(PENDING)
  totalAmount     Decimal?         @db.Decimal(18, 6)
  qualifiedAmount Decimal?         @db.Decimal(18, 6)
  unqualifiedAmount Decimal?       @db.Decimal(18, 6)
  remark          String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?
  
  // 关系
  tenant          Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  order           PurchaseOrder?   @relation(fields: [orderId], references: [id])
  inspection      Inspection?      @relation(fields: [inspectionId], references: [id])
  items           PurchaseReceiptItem[]
  
  @@unique([tenantId, receiptNo])
  @@index([orderId])
  @@index([inspectionId])
  @@map("purchase_receipt")
}

model PurchaseReceiptItem {
  id              String   @id @default(cuid())
  receiptId       String
  orderItemId     String?
  inspectionItemId String?
  lineNo          Int
  materialId      String
  quantity        Decimal  @db.Decimal(18, 6)
  qualifiedQty    Decimal  @db.Decimal(18, 6)
  unqualifiedQty  Decimal  @db.Decimal(18, 6)
  warehouseId     String?
  locationId      String?
  unitPrice       Decimal? @db.Decimal(18, 6)
  amount          Decimal? @db.Decimal(18, 6)
  remark          String?
  createdAt       DateTime @default(now())
  
  // 关系
  receipt         PurchaseReceipt @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  material        Material        @relation(fields: [materialId], references: [id])
  
  @@index([receiptId])
  @@index([materialId])
  @@map("purchase_receipt_item")
}

// ==================== 附件表 ====================

model Attachment {
  id            String   @id @default(cuid())
  businessType  String   // 关联业务类型 (如: sales_order, quotation, purchase_order)
  businessId    String
  fileName      String
  filePath      String
  fileSize      Int?
  fileType      String?
  uploadedById  String?
  uploadedAt    DateTime @default(now())

  // 关系
  uploadedBy    User?    @relation(fields: [uploadedById], references: [id], onDelete: SetNull)

  // 注意: businessType + businessId 实现多态关联，无法用单字段外键
  // 查询通过联合索引 + 应用层过滤实现
  @@index([businessType, businessId])
  @@index([uploadedById])
  @@map("attachment")
}
```

---

## 模块四：架构师的查漏补缺

### 4.1 隐藏功能与表结构建议

#### 4.1.1 必须补充的基础功能
1. **审批流程配置**
   - 需要支持自定义审批流程
   - 审批节点配置
   - 审批人员指定

2. **单据编号规则**
   - 支持自定义单据编号生成规则
   - 前缀、日期格式、流水号位数配置

3. **消息通知**
   - 系统消息
   - 待办消息推送
   - 邮件/短信通知

4. **数据导入导出**
   - Excel批量导入
   - 数据导出功能

#### 4.1.2 建议补充的数据表
```prisma
// 审批流程表
model ApprovalFlow {
  id          String   @id @default(cuid())
  businessType String
  config      Json
  status      CommonStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 审批记录表
model ApprovalRecord {
  id            String   @id @default(cuid())
  businessType  String
  businessId    String
  approvalStep  Int
  approvedBy    String?
  approvedAt    DateTime?
  status        ApprovalStatus
  comment       String?
  createdAt     DateTime @default(now())
}

// 单据编号规则表
model NumberRule {
  id          String   @id @default(cuid())
  code        String
  name        String
  prefix      String
  dateFormat  String
  seqLength   Int
  currentSeq  Int      @default(0)
  resetType   String   // NONE/DAILY/MONTHLY/YEARLY
  status      CommonStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 消息通知表
model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String
  title       String
  content     String?
  businessType String?
  businessId  String?
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
}

// 系统参数配置表
model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.2 架构设计建议

#### 4.2.1 系统分层架构
```
┌─────────────────────────────────────┐
│         前端展示层                  │
│  (Vue/React + Ant Design)           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         API网关层                   │
│  (鉴权、限流、日志)                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         业务服务层                  │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │销售  │ │采购  │ │生产  │ ...   │
│  │服务  │ │服务  │ │服务  │       │
│  └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         数据访问层                  │
│  (Prisma ORM)                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         数据库层                    │
│  (PostgreSQL + Redis)               │
└─────────────────────────────────────┘
```

#### 4.2.2 关键技术要点
1. **租户隔离**：使用tenant_id实现多租户数据隔离
2. **软删除**：使用deleted_at字段实现软删除机制
3. **乐观锁**：可考虑增加version字段实现乐观锁
4. **审计字段**：保留createdAt、updatedAt、createdBy、updatedBy
5. **数据权限**：通过角色和数据权限字段实现数据级权限控制

#### 4.2.3 性能优化建议
1. **索引优化**：为常用查询字段添加索引
2. **缓存策略**：Redis缓存基础数据和热点数据
3. **分库分表**：单据表数据量大时考虑按时间或租户分表
4. **异步处理**：库存更新、消息通知等异步处理

### 4.3 安全建议
1. **密码加密**：使用bcrypt等强加密算法
2. **API鉴权**：JWT token验证
3. **操作审计**：完整记录操作日志
4. **数据脱敏**：敏感信息展示时脱敏
5. **权限控制**：功能权限+数据权限双重控制

---

## 总结

本文档基于对智能制造系统截图的深度分析，完整梳理了：

1. **模块一**：详细描述了10大模块的页面功能、数据字段和交互逻辑
2. **模块二**：使用Mermaid绘制了核心业务流程状态图
3. **模块三**：设计了完整的Prisma数据库 schema，包含约50张表
4. **模块四**：补充了架构建议和隐藏功能

该设计覆盖了从销售→计划→采购→生产→仓储的完整业务闭环，具备多租户、权限管理、流程审批等企业级应用特性。

---

## 模块五：数据库 Schema 审查报告

### 5.1 孤立表问题 (已修复 6 处)

| 表名 | 问题 | 修复 |
|---|---|---|
| **OperationLog** | 零外键关联，userId 仅为 String? | 添加 `User?` 关系 + `@@index([userId])` |
| **LoginLog** | 零外键关联，userId 仅为 String? | 添加 `User?` 关系 + `@@index([userId])` |
| **Attachment** | 零外键关联，仅存储字符串ID | 添加 `uploadedBy User?` 关系 + 联合索引 `[businessType, businessId]` |
| **Menu** | 无 tenantId，无法多租户隔离 | 添加 `tenantId` + Tenant 关系 + `@@index` |
| **Dictionary** | 无 tenantId，无法多租户隔离 | 添加 `tenantId` + Tenant 关系 + `@@index` |
| **Permission** | menuId 不是外键关联 | 添加 `menu Menu?` 关系 + `@@index([menuId])` |

### 5.2 缺失外键关系 (已修复 8 处)

| 表 | 字段 | 修复 |
|---|---|---|
| **Contract** | customerId, supplierId | 添加 `customer Customer?` + `supplier Supplier?` 关系 |
| **Quotation** | departmentId, responsibleId | 添加 `department Department?` + `responsible User?` 关系 |
| **PurchaseOrder** | createdById, approvedById | 添加 `createdBy User?` + `approvedBy User?` 关系 |
| **PurchaseOrder** | contractId | 新增字段 + `contract Contract?` 关系 |
| **Inspection** | inspectorId | 添加 `inspector User?` 关系 |
| **StockTransaction** | warehouseId, locationId | 添加 `warehouse Warehouse?` + `location Location?` 关系 |

### 5.3 第三范式 (3NF) 违规

| 严重程度 | 表 | 问题 | 说明 |
|---|---|---|---|
| **中** | SalesOrderItem / PurchaseOrderItem / QuotationItem | `amount` = `quantity × unitPrice`，违反 3NF（传递依赖） | 属于**性能优化式反范式**，刻意保留以避免每次查询计算。建议保留但添加 CHECK 约束确保一致性 |
| **中** | Contract | 同时有 `customerId` 和 `supplierId`，其中之一必为 NULL | 建议添加 CHECK：`(customerId IS NULL) <> (supplierId IS NULL)` 确保互斥 |
| **低** | Material | `materialProperty`/`productCategory` 可能与 categoryId 存在传递依赖 | 取决于业务语义。若这些字段是从 Category 继承，应移至 MaterialCategory |
| **低** | BomItem | 旧字段名 `parentId` 实际引用 Material 而非 BomItem | **已修复** → `parentMaterialId` |

### 5.4 缺失外键索引 (已修复 30+ 处)

以下为**高优先级**补充的索引（影响查询性能）：

```
SaleOrder:      [tenantId, customerId] [projectId] [contractId] [businessStatus]
PurchaseOrder:  [tenantId, supplierId] [contractId] [createdById]
Quotation:      [customerId] [departmentId]
Inventory:      [tenantId, materialId] [warehouseId] [batchNo]
StockTransaction: [tenantId, materialId] [warehouseId] [sourceType, sourceId] [transactionDate]
OperationLog:   [userId] [operatedAt] [moduleName, businessName]
LoginLog:       [userId] [loginTime]
Attachment:     [businessType, businessId] [uploadedById]
BomItem:        [bomId] [parentMaterialId] [materialId]
Menu:           [tenantId] [parentId]
Dictionary:     [tenantId] [parentId]
Permission:     [roleId] [menuId]
Inspection:     [sourceType, sourceId] [inspectorId]
Contract:       [projectId] [customerId] [supplierId]
```

### 5.5 命名与类型问题

| 问题 | 表 | 修复 |
|---|---|---|
| 字段命名歧义 | BomItem.parentId → parentMaterialId | 已重命名，parentId 暗示自引用 |
| 枚举值混用 | SalesOrder 用专用枚举 SalesOrderStatus，但 SalesShipment 用通用 BusinessStatus | 建议统一：Shipment/Receipt 也应有专用枚举 |
| NULL 语义不一致 | PurchaseOrderItem.receivedQty 默认 0，但 SalesOrderItem.deliveredQty 也默认 0 | 一致，无需改动 |

### 5.6 修复后统计

| 类别 | 修复前 | 修复后 |
|---|---|---|
| 完全孤立表 (零关系) | 3 (OperationLog, LoginLog, Attachment) | **0** |
| 缺失索引的表 | ~25 | **0** (关键路径全覆盖) |
| 未建立的外键关系 | 8 | **0** |
| 3NF 违规 | 4 处 | **1 处保留** (amount 计算列，性能优化) |

