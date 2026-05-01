# @skillsos/web

Claude 风格的管理 UI（Vite + React + TS）。

## 功能
- 首页：导航 + Hero 介绍 + 大搜索框 + 推荐 Skills
- 列表页：左侧分类（类型 / 标签）+ 右侧卡片列表 + 搜索
- 详情页：内容介绍 + 安装命令 + 元数据侧栏

## 启动

```bash
# 在仓库根目录
pnpm install
pnpm web                # 开发模式 -> http://localhost:5173
pnpm web:build          # 生产构建 -> apps/web/dist/
```

## 与 server 联动
开发服务器已配置 `/api -> http://127.0.0.1:7421` 反向代理。
未启动 server 时，UI 会回退到内置 mock 数据，方便单独预览界面。
