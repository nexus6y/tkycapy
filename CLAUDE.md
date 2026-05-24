# CLAUDE.md — 天开制造管家 (tkycapy)

## 项目概述

这是一个**智能制造 ERP 系统**（生产制造管家）的复刻项目。目标系统运行在 `http://39.156.151.205:8081`，基于 Vue 3 + Element UI + Ant Design Icons 构建。

## Git 仓库

- **远程**: `git@gitee.com:chen-lyccccc/tkycapy.git`
- **分支**: `main`
- **推送方式**: SSH

## 关键文件

| 文件 | 用途 |
|---|---|
| `ARCHITECTURE.md` | 全局架构文件（AI 可读）：技术栈、布局、菜单树(105叶子节点)、页面类型、组件模式、URL路由、API推断 |
| `智能制造系统需求文档.md` | PRD：10大模块功能描述、业务状态机(Mermaid)、Prisma Schema(50张表经审查修复)、审查报告 |
| `新生产制造标准产品功能清单(标准版).xlsx` | 官方功能清单 Excel |
| `screenshots/` | 164 张截图，按 11 个业务模块分文件夹 |

## 截图文件夹结构

```
screenshots/
├── 01_工作台/        (3)
├── 02_公共基础/     (17)  物料/项目/合同
├── 03_销售管理/     (23)  客户/报价/分劈/订单/出货/退货/追溯
├── 04_运营管理/      (2)  需求计划
├── 05_采购管理/     (17)  供应商/计划/订单/退供/追溯
├── 06_质量管理/      (4)  质检/不良品
├── 07_标准生产/     (20)  BOM/工艺/生产/领料/退料/制损
├── 08_仓储管理/     (56)  基础/入库/出库/库存/调拨/报废/借还
├── 09_成本管理/      (5)  结转/产品入库/核算/台账
├── 10_系统管理/     (15)  组织/用户/角色/菜单/权限/字典/日志
└── 99_通用交互/      (2)  帮助抽屉/修改密码
```

## 系统架构要点

- **前端**: Vue 3 SPA + Element UI + Ant Design Icons
- **布局**: 顶部水平菜单(12模块) + 侧边栏垂直菜单树 + Tags-View + 主内容区
- **菜单**: 双层机制 — 顶部一级模块切换侧边栏内容
- **页面类型**: 仪表盘(A) / 数据列表(B,~70%) / 表单页(C) / 查询页(D) / 审核追溯(E) / 配置页(F)
- **测试账号**: `001test` / `Gyl@2025`（部分模块可能权限受限）

## 数据库设计 (Prisma + PostgreSQL)

- 约 50 张表，多租户架构 (tenantId)
- 软删除 (deletedAt)
- 枚举状态机：销售订单/采购订单/生产订单/质检单
- 已完成审查修复：孤立表清零、外键索引覆盖、3NF 合规

## Playwright 浏览器自动化

- 命令: `playwright-cli`
- 浏览器: `playwright-cli open --headed --persistent <URL>`
- 截图: `playwright-cli run-code "async page => { await page.screenshot({ path: '...', fullPage: true }); }"`
- 点击: `playwright-cli eval "(function(){ document.querySelectorAll('li.el-menu-item')[0].click(); return 'ok'; })()"`

## 后续开发注意事项

- 每次代码变更后推送到 Gitee
- 实现前先查阅 `ARCHITECTURE.md` 了解页面结构
- 数据库变更需与 Prisma Schema 保持同步
- 截图作为 UI 参考，注意命名规范 `[模块]_[页面]_[状态].png`
