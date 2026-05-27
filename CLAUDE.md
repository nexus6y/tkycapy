# CLAUDE.md — 天开制造管家 (tkycapy)

## 项目概述

智能制造 ERP 系统复刻项目。目标系统 `http://39.156.151.205:8081` (Vue 3 + Element UI)。
本项目用 **Next.js 16 + React 19 + shadcn/ui + Tailwind + NestJS + Prisma + PostgreSQL** 重实现。

## Git

- 远程: `git@gitee.com:chen-lyccccc/tkycapy.git` / 分支: `main`

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 |
| UI | shadcn/ui + 自定义 ErpTable 系列组件 + Lucide React 图标 |
| 后端 | NestJS 11 + Prisma 7.8 + PostgreSQL |
| 认证 | JWT (localStorage token) + bcryptjs |

## AI 参考文档 (必读)

| 文件 | 用途 |
|---|---|
| `docs/architecture.md` | 全局架构：菜单树、页面类型(A-F)、路由映射、组件模式 |
| `docs/business-flows.md` | 10模块业务流、状态机、push-down下推链、workflow按钮模式 |
| `docs/data-relationships.md` | 实体关联图、溯源字段策略、下拉数据源API映射、缺失字段清单 |
| `docs/prd.md` | 原始PRD、Mermaid状态机、Prisma Schema审查报告 |

## 当前系统状态

- **180 个功能页面**，零空壳/SKEL
- **40+ Prisma 模型**，50+ API 端点
- **5 条跨模块下推链**：制损→采购 / 到货→入库 / 盘点→调整→库存 / 销售出货→出库 / 报废→处置
- **10 种库存自动化操作**：入库/出库/调拨/报废/借出/归还/领料/退料/完工/调整
- **成本台账自动写入**：所有库存变动自动记录 cost_ledger

## 关键命令

```bash
# 前端 (port 3000)
cd frontend && pnpm dev

# 后端 (port 3001)
cd backend && pnpm start:dev

# DB schema sync
cd backend && npx prisma db push

# Playwright 浏览器
playwright-cli open --headed --persistent <URL>
```

## 新增模型 (相对于目标系统)

| 模型 | 表名 | 用途 |
|---|---|---|
| IssueOrder | issue_order | 领料单 |
| ReturnOrder | return_order | 退料单 |
| PurchasePlan | purchase_plan | 采购计划 |
| AdjustOrder | adjust_order | 调整单 |
| CompleteReport | complete_report | 完工报告 |
| Zone/Passage/Shelf/Location | zone/passage/shelf/location | 仓储层级 |

## 库存自动化规则

审批通过后自动执行：
- 入库 → 库存↑ + 成本(入库)
- 出库 → 库存↓ + 成本(出库)
- 调拨 → 调出仓↓调入仓↑
- 领料 → 库存↓ + 成本(领料)
- 退料 → 库存↑ + 成本(退料)
- 完工 → 成品入库 + 成本(产品入库)
- 报废 → 库存↓
- 借出 → 可用↓锁定↑
- 归还 → 可用↑锁定↓
- 调整 → 库存±

## 测试账号

`001test` / `Gyl@2025` (目标系统，部分模块权限受限)
