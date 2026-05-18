# 序言

简洁高效的新标签页浏览器扩展

## 功能特点

- **快捷方式管理** - 自由添加、编辑、删除网页快捷方式
- **分组管理** - 支持快捷方式分组，自定义分组名称和图标
- **快速搜索** - 内置搜索栏，支持多种搜索引擎
- **搜索历史** - 自动记录搜索历史，快速访问常用搜索
- **主题适配** - 支持浅色/深色主题自动切换
- **导入导出** - 支持快捷方式和分组的导入导出
- **Favicon 缓存** - 自动缓存网站图标，加载更快

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

# 开发模式（Firefox）
pnpm dev:firefox

# 构建
pnpm build        # Chrome
pnpm build:firefox # Firefox

# 类型检查
pnpm compile

# E2E 测试
pnpm test:e2e
pnpm test:e2e:ui    # UI 模式
pnpm test:e2e:debug # 调试模式
```

## 项目结构

```
src/
├── components/       # React 组件
│   ├── ui/           # 基础 UI 组件
│   ├── BackgroundDialog.tsx    # 背景设置弹窗
│   ├── GroupDialog.tsx         # 分组管理弹窗
│   ├── GroupLayout.tsx         # 分组布局
│   ├── ImportExportDialog.tsx  # 导入导出弹窗
│   ├── SearchBar.tsx           # 搜索栏
│   ├── SettingsSheet.tsx       # 设置面板
│   ├── ShortcutCard.tsx        # 快捷方式卡片
│   ├── ShortcutDialog.tsx      # 快捷方式编辑弹窗
│   ├── ShortcutGrid.tsx        # 快捷方式网格
│   └── ShortcutGroupCard.tsx   # 分组卡片
├── hooks/            # 自定义 Hooks
│   ├── useDebounce.ts
│   ├── useGroups.ts
│   ├── useSearchEngine.ts
│   ├── useSearchHistory.ts
│   ├── useShortcuts.ts
│   └── useTheme.ts
├── utils/            # 工具函数
│   ├── constants.ts  # 常量定义
│   ├── faviconCache.ts  # Favicon 缓存
│   ├── importExport.ts  # 导入导出逻辑
│   ├── types.ts      # 类型定义
│   └── utils.ts      # 通用工具

entrypoints/
├── background.ts     # 后台脚本
├── popup/           # 弹出面板
│   ├── App.tsx
│   └── main.tsx
└── newtab/          # 新标签页
    ├── App.tsx
    └── main.tsx
```

## 扩展入口

- **popup** - 点击扩展图标打开的弹出面板
- **newtab** - 打开新标签页时显示

## 构建产物

构建完成后，产物在 `.output-chrome/` 或 `.output-firefox/` 目录下

## License

MIT
