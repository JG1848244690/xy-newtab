# 序言

简洁高效的新标签页浏览器扩展。只做一件事：把你的 Chrome 新标签页换成自己的 Speed Dial。

## 功能特点

- **快捷方式管理** - 自由添加、编辑、删除网页快捷方式
- **分组管理** - 分组名称、图标、颜色，支持拖拽排序与批量移动/复制
- **两种布局** - 分组卡片布局（默认）/ 底部 dock 布局
- **背景自定义** - 纯色、精选壁纸、本地图片、本地视频（存 IndexedDB）
- **主题适配** - 支持浅色/深色主题自动切换
- **导入导出** - JSON 备份还原 / 一键导入 Chrome 书签
- **云同步（可选）** - Google 登录后手动上传/下载书签与分组
- **多语言** - English / 简体中文
- **Favicon 缓存** - 自动缓存网站图标，加载更快

> 说明：本扩展**不提供**网页搜索框，也不修改你的默认搜索引擎。搜索请直接使用 Chrome 地址栏。

## 技术栈

- **框架**: [WXT](https://wxt.dev/) - 现代化的浏览器扩展开发框架
- **前端**: React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **UI 组件**: Radix UI + 自定义组件
- **拖拽**: @dnd-kit
- **测试**: Playwright

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（Chrome）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm compile

# E2E 测试（会启动真实 Chrome 窗口）
pnpm test:e2e
```

## 项目结构

```
src/
├── components/       # React 组件
│   ├── ui/                     # 基础 UI 组件
│   ├── BackgroundDialog.tsx    # 背景设置弹窗
│   ├── DockLayout.tsx          # dock 布局
│   ├── GroupLayout.tsx         # 分组布局
│   ├── ImportExportDialog.tsx  # 导入导出 / 云同步
│   ├── MigrateDialog.tsx       # 迁移 / 复制到分组
│   ├── SettingsSheet.tsx       # 设置面板
│   ├── ShortcutCard.tsx        # 快捷方式卡片
│   ├── ShortcutDialog.tsx      # 快捷方式编辑弹窗
│   └── ShortcutGroupCard.tsx   # 分组卡片
├── hooks/            # 自定义 Hooks（store 薄壳）
├── store/            # 订阅式 store（shortcuts / groups / settings）
├── services/         # 纯业务逻辑（无副作用，便于测试）
├── schemas/          # 运行时数据校验
├── i18n/             # 自研极简 i18n（en / zh_CN）
├── lib/              # store / storage 基建
└── utils/            # 常量、类型、favicon、云同步、导入导出

entrypoints/
├── background.ts     # 后台脚本（消息路由 / 云同步 / 书签导入）
├── popup/            # 弹出面板（快捷搜索本地快捷方式、快捷添加、设置）
└── newtab/           # 新标签页
```

## 扩展入口

- **popup** - 点击扩展图标（或 `Ctrl+Y`）打开，用于快速添加当前页面、筛选本地快捷方式
- **newtab** - 打开新标签页时显示

## 构建产物

构建完成后产物在 `.output/chrome-mv3/` 目录下。上传 Chrome 应用商店前，注意 `manifest.json` 里的 `key` 字段需要移除（详见 `wxt.config.ts` 注释）。

## 隐私

详见 [docs/privacy-policy.md](docs/privacy-policy.md)（商店后台需填写公开可访问的 URL）。

## License

MIT
