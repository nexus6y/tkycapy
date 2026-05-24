# 技术栈定义

## 前端

| 类别 | 选型 |
|---|---|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | TailwindCSS |
| 组件库 | shadcn-ui (基于 Radix UI) |
| 状态管理 | React Query (服务端状态) + Zustand (客户端状态) |
| 表单 | React Hook Form + Zod |
| 表格 | TanStack Table (原 React Table) |
| HTTP | Axios |
| 图标 | Lucide React |

## 后端

| 类别 | 选型 |
|---|---|
| 框架 | NestJS |
| 语言 | TypeScript |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| 缓存 | Redis (ioredis) |
| 鉴权 | JWT (passport-jwt) |
| 验证 | class-validator + class-transformer |
| API 文档 | Swagger (nestjs/swagger) |
| 文件上传 | multer |

## 开发工具

| 类别 | 选型 |
|---|---|
| 包管理 | pnpm |
| 代码规范 | ESLint + Prettier |
| Git Hooks | husky + lint-staged |
| 测试 | Jest + Playwright |

## 项目结构

```
tkycapy/
├── frontend/          # Next.js 前端
│   ├── src/
│   │   ├── app/       # App Router 页面
│   │   ├── components/# 组件
│   │   ├── hooks/     # 自定义 hooks
│   │   ├── lib/       # 工具函数
│   │   └── types/     # 类型定义
│   └── ...
├── backend/           # NestJS 后端
│   ├── src/
│   │   ├── modules/   # 业务模块
│   │   ├── common/    # 公共模块 (守卫/拦截器/装饰器)
│   │   ├── prisma/    # Prisma 服务
│   │   └── config/    # 配置文件
│   └── prisma/
│       └── schema.prisma
└── docs/              # 项目文档
    ├── prd.md
    ├── architecture.md
    ├── schema.prisma
    ├── tech-stack.md
    └── 功能清单.xlsx
```
