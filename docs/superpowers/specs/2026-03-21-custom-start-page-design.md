# 自定义起始页设计文档

## 概述

创建一个类似谷歌起始页的自定义新标签页，支持快捷方式管理、搜索引擎切换和主题切换。

## 技术栈

- **框架**: WXT + React 19
- **样式**: Tailwind CSS v4 + shadcn/ui
- **存储**: @wxt-dev/storage
- **图标**: Lucide React

## 功能需求

### 1. 快捷方式 CRUD

#### 1.1 添加快捷方式
- 点击"添加"按钮弹出 Dialog
- 表单字段：
  - 名称（必填）
  - 网址（必填，自动补全 https://）
- 自动获取网站 favicon
- 保存到 storage

#### 1.2 编辑快捷方式
- 右键或长按卡片进入编辑模式
- 复用添加弹窗，预填充现有数据

#### 1.3 删除快捷方式
- Hover 显示删除按钮（已有实现）
- 点击确认删除

#### 1.4 展示
- 显示网站 favicon + 名称
- 点击打开新标签页
- 卡片 hover 效果

### 2. 搜索引擎切换

#### 2.1 支持的搜索引擎
| 引擎 | 搜索 URL |
|------|----------|
| Google | `https://www.google.com/search?q=` |
| Bing | `https://www.bing.com/search?q=` |
| DuckDuckGo | `https://duckduckgo.com/?q=` |
| 百度 | `https://www.baidu.com/s?wd=` |

#### 2.2 交互
- 下拉框选择搜索引擎
- 当前选择显示在搜索框左侧
- 设置持久化到 storage

#### 2.3 搜索行为
- 输入关键词，回车或点击搜索按钮
- 在新标签页打开搜索结果

### 3. 主题切换

#### 3.1 支持的主题
- 浅色（Light）
- 深色（Dark）
- 跟随系统（System）

#### 3.2 交互
- 主题切换按钮（Sun/Moon 图标）
- 点击循环切换：Light → Dark → System
- 设置持久化到 storage

#### 3.3 实现方式
- Tailwind CSS `dark:` 前缀
- CSS 变量（shadcn/ui 默认方案）
- 监听 `prefers-color-scheme` 媒体查询

## 文件结构

```
src/
├── components/
│   ├── ui/                    # shadcn 组件
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── dropdown-menu.tsx
│   ├── SearchBar.tsx          # 搜索栏组件
│   ├── ShortcutGrid.tsx       # 快捷方式网格
│   ├── ShortcutCard.tsx       # 快捷方式卡片
│   ├── ShortcutDialog.tsx     # 添加/编辑弹窗
│   └── ThemeToggle.tsx        # 主题切换按钮
├── hooks/
│   ├── useShortcuts.ts        # 快捷方式状态管理
│   ├── useSearchEngine.ts     # 搜索引擎状态管理
│   └── useTheme.ts            # 主题状态管理
├── lib/
│   └── utils.ts               # shadcn cn() 工具函数
└── utils/
    ├── constants.ts           # 常量定义
    ├── types.ts               # 类型定义
    └── favicon.ts             # favicon 获取工具
```

## 组件设计

### SearchBar

```tsx
interface SearchBarProps {
  engine: SearchEngine;
  onEngineChange: (engine: SearchEngine) => void;
}
```

- 左侧：搜索引擎下拉选择
- 中间：搜索输入框
- 右侧：搜索按钮

### ShortcutCard

```tsx
interface ShortcutCardProps {
  shortcut: Shortcut;
  onEdit: (shortcut: Shortcut) => void;
  onRemove: (id: string) => void;
}
```

- 图标区域：favicon 或首字母
- 名称区域：显示名称
- Hover：显示编辑和删除按钮

### ShortcutDialog

```tsx
interface ShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcut?: Shortcut;  // 编辑时传入
  onSave: (data: { name: string; url: string }) => void;
}
```

- 名称输入框
- 网址输入框
- 取消/保存按钮

### ThemeToggle

```tsx
// 无 props，内部管理状态
```

- Sun 图标（浅色模式）
- Moon 图标（深色模式）
- Monitor 图标（跟随系统）

## 数据结构

### Shortcut

```ts
interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon?: string;  // favicon URL
  createdAt: number;
  updatedAt: number;
}
```

### SearchEngine

```ts
type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'baidu';

interface SearchEngineOption {
  id: SearchEngine;
  name: string;
  url: string;
  icon: string;
}
```

### Theme

```ts
type Theme = 'light' | 'dark' | 'system';
```

### Settings

```ts
interface Settings {
  theme: Theme;
  searchEngine: SearchEngine;
  iconsPerRow: number;
}
```

## 存储键

| Key | Type | Description |
|-----|------|-------------|
| `local:shortcuts` | Shortcut[] | 快捷方式列表 |
| `local:settings` | Settings | 用户设置 |

## Favicon 获取策略

1. 优先使用 Google Favicon 服务：`https://www.google.com/s2/favicons?domain=xxx&sz=64`
2. 备选：`https://favicon.im/xxx?larger=true`
3. 失败时显示首字母

## 主题实现

### CSS 变量（shadcn/ui 默认）

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Tailwind 配置

```ts
// tailwind.config.ts
export default {
  darkMode: 'class',
  // ...
}
```

### 主题切换逻辑

```ts
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(isDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}
```

## 交互流程

### 添加快捷方式

1. 用户点击"添加"按钮
2. 打开 ShortcutDialog
3. 输入名称和网址
4. 自动获取 favicon
5. 点击保存
6. 关闭弹窗，刷新列表

### 搜索

1. 选择搜索引擎
2. 输入搜索词
3. 回车或点击搜索
4. 新标签页打开搜索结果

### 切换主题

1. 点击 ThemeToggle 按钮
2. 循环切换 Light → Dark → System
3. 立即应用主题
4. 保存到 storage

## 待办事项

- [ ] 安装配置 shadcn/ui
- [ ] 实现 useTheme hook
- [ ] 实现 useSearchEngine hook
- [ ] 更新 useShortcuts hook
- [ ] 实现 favicon 获取
- [ ] 重构 SearchBar 组件
- [ ] 重构 ShortcutCard 组件
- [ ] 实现 ShortcutDialog 组件
- [ ] 实现 ThemeToggle 组件
- [ ] 更新新标签页布局
- [ ] 测试暗色/亮色模式切换
