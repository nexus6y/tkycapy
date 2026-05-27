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
| UI | shadcn/ui + 自定义 ErpTable 系列 + Lucide React 图标 |
| 后端 | NestJS 11 + Prisma 7.8 + PostgreSQL |
| 认证 | JWT (localStorage token) + bcryptjs |

## 关键命令

```bash
# 前端 (port 3000)
cd frontend && pnpm dev

# 后端 (port 3001)
cd backend && pnpm start:dev

# DB schema sync
cd backend && npx prisma db push

# Playwright 浏览器
playwright-cli open --headed --persistent http://localhost:3000
```

## 系统规模

| 指标 | 数值 |
|---|---|
| 前端页面 | 172 (零 SKEL) |
| Prisma 模型 | 45+ |
| API 端点 | 50+ |
| 提交数 | 52 |

## AI 参考文档

| 文件 | 内容 |
|---|---|
| `docs/architecture.md` | 架构、菜单树、页面类型(A-F)、路由映射 |
| `docs/business-flows.md` | 10模块业务流、状态机、12条push-down链、workflow模式 |
| `docs/data-relationships.md` | 实体关联图、溯源字段、下拉数据源、缺失字段清单 |
| `docs/backend-business-logic.md` | 编码规则、状态机定义、库存规则、成本核算、质检逻辑 |
| `docs/prd.md` | 原始PRD、Mermaid状态机、Schema审查 |

## 后端业务逻辑 (已实现)

| 功能 | 覆盖 |
|---|---|
| 编码自动生成 | Zone/Shipment/Inbound/Outbound/PPlan/Issue/Return/Check (8实体) |
| 状态机守卫 | 13个controller (submit: DRAFT→SUBMITTED, approve: SUBMITTED→APPROVED) |
| 库存校验 | 出库/领料审批前检查可用库存 |
| 业务状态流转 | 出货→订单PARTIAL_SHIP, 领料→生产ISSUING, 完工→COMPLETED, 退料→ISSUING |
| 加权平均成本 | 出库/领料从入库均价计算成本 |
| 库存自动更新 | 入库/出库/调拨/领料/退料/报废/借出/归还/完工/调整 (10种) |
| 成本台账 | 所有库存变动自动写入cost_ledger |
| Prisma异常 | P2002唯一冲突/P2003外键/P2025未找到 → 中文消息 |
| 下推链 | 12条 (报价→分劈→订单→生产→出货→出库→成本...) |

## 下推链清单

```
1. 报价(APPROVED) → 分劈单
2. 分劈(APPROVED) → 销售订单
3. 销售订单(APPROVED) → 生产订单
4. 销售出货(APPROVED) → 出库单
5. 需求计划(APPROVED) → 采购计划
6. 采购计划(APPROVED) → 采购订单
7. 质检(APPROVED) → 入库单(合格品)
8. 制损 → 采购计划(补料)
9. 到货确认 → 入库单
10. 盘点(差异) → 调整单 → 库存修正
11. 报废申请 → 处置单
12. 完工报告(APPROVED) → 产品入库
```

## 测试账号

`001test` / `Gyl@2025` (目标系统，部分模块权限受限)
