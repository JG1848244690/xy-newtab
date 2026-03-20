---
name: wxt
description: WXT 浏览器扩展开发框架助手 - 帮助开发者使用 WXT 框架构建跨浏览器扩展（Chrome、Firefox、Edge、Safari）。支持 TypeScript/JavaScript，内置 Vue、React、Svelte、SolidJS 模板。覆盖项目结构、入口点配置、构建打包、发布等全流程。
---

# WXT 浏览器扩展开发框架

## WXT 简介

WXT 是一个现代化的开源浏览器扩展开发框架，受 Nuxt 启发，提供：
- 卓越的开发体验 (DX)
- 对所有主流浏览器的顶级支持
- 内置构建、打包、发布工具

## 项目结构

### 默认结构（扁平化）

```
📂 {rootDir}/
   📁 .output/        # 构建产物输出目录
   📁 .wxt/           # WXT 生成的配置
   📁 assets/         # CSS、图片等需要处理的资源
   📁 components/     # UI 组件（自动导入）
   📁 composables/    # Vue 组合式函数（自动导入）
   📁 entrypoints/    # 扩展入口点（核心目录）
   📁 hooks/          # React/Solid hooks（自动导入）
   📁 modules/        # 本地 WXT 模块
   📁 public/         # 静态资源（直接复制，不处理）
   📁 utils/          # 通用工具函数（自动导入）
   📄 .env            # 环境变量
   📄 .env.publish    # 发布环境变量
   📄 app.config.ts   # 运行时配置
   📄 package.json    # 项目依赖配置
   📄 tsconfig.json   # TypeScript 配置
   📄 web-ext.config.ts # 浏览器启动配置
   📄 wxt.config.ts   # WXT 主配置文件
```

### 使用 src/ 目录结构

在 `wxt.config.ts` 中启用：

```typescript
export default defineConfig({
  srcDir: 'src',
});
```

启用后的结构：

```
📂 {rootDir}/
   📁 .output/
   📁 .wxt/
   📁 modules/
   📁 public/
   📂 src/
      📁 assets/
      📁 components/
      📁 composables/
      📁 entrypoints/
      📁 hooks/
      📁 utils/
      📄 app.config.ts
   📄 .env
   📄 .env.publish
   📄 package.json
   📄 tsconfig.json
   📄 web-ext.config.ts
   📄 wxt.config.ts
```

### 自定义目录配置

```typescript
// wxt.config.ts
export default defineConfig({
  // 相对于项目根目录
  srcDir: "src",             // 默认: "."
  modulesDir: "wxt-modules", // 默认: "modules"
  outDir: "dist",            // 默认: ".output"
  publicDir: "static",       // 默认: "public"

  // 相对于 srcDir
  entrypointsDir: "entries", // 默认: "entrypoints"
});
```

## 快速开始

### 1. 创建新项目

```bash
# 使用 pnpm
pnpm dlx wxt@latest init

# 使用 npm
npx wxt@latest init

# 使用 bun
bunx wxt@latest init

# 使用 yarn
npx wxt@latest init
```

### 2. 可选模板

- Vanilla + TypeScript
- Vue + TypeScript
- React + TypeScript
- Svelte + TypeScript
- Solid + TypeScript

### 3. 添加脚本到 package.json

```json
{
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "postinstall": "wxt prepare"
  }
}
```

### 4. 运行开发模式

```bash
pnpm dev
```

WXT 会自动打开浏览器并安装你的扩展。

## 入口点 (Entrypoints)

入口点位于 `entrypoints/` 目录，是扩展的核心文件。WXT 会将这些文件打包到扩展中。

> 📖 **详细说明**：查看 [references/entrypoints.md](references/entrypoints.md) 获取完整的入口点类型详解。

### 入口点定义方式

入口点可以是单文件或目录结构：

```
📂 entrypoints/
   📄 {name}.{ext}          # 单文件方式

# 或

📂 entrypoints/
   📂 {name}/               # 目录方式
      📄 index.{ext}
```

**注意**：不要将相关文件直接放在 `entrypoints/` 目录下，WXT 会尝试将它们作为入口点构建。

### 入口点类型总览

WXT 支持两种入口点类型：
- **Listed（已列出）**：在 `manifest.json` 中引用
- **Unlisted（未列出）**：不在 manifest 中引用，但在扩展中使用

### 常用入口点速查

| 类型 | 文件名 | 用途 |
|------|--------|------|
| **Background** | `background.ts` | 后台脚本/Service Worker |
| **Content Script** | `*.content.ts` | 注入到网页的脚本 |
| **Popup** | `popup.html` | 点击扩展图标弹出的页面 |
| **Options** | `options.html` | 扩展设置页 |
| **Newtab** | `newtab.html` | 自定义新标签页 |
| **Side Panel** | `sidepanel.html` | 侧边栏面板 |

### 快速示例

**Background 脚本**：
```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  console.log('Background loaded!');
});
```

**Content Script（基础）**：
```typescript
// entrypoints/content.content.ts
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Content script loaded');
  },
});
```

**Content Script（React + Shadow DOM）**：
```tsx
// entrypoints/my-ui.content.tsx
import ReactDOM from 'react-dom/client';
import App from '@/components/App';
import '~/assets/tailwind.css';  // Tailwind CSS

export default defineContentScript({
  matches: ['https://example.com/*'],
  cssInjectionMode: 'ui',  // CSS 注入到 Shadow DOM

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'my-ui',
      position: 'inline',
      anchor: document.querySelector('.target'),  // 可选：定位到特定元素
      append: 'after',  // 在目标元素后插入
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
        return root;  // 返回用于 onRemove 清理
      },
      onRemove: (root) => {
        root?.unmount();  // React 18+ 卸载
      },
    });
    ui.mount();
  },
});
```

**Popup (Vue)**：
```vue
<!-- entrypoints/popup.vue -->
<template>
  <div>
    <h1>Hello from WXT!</h1>
  </div>
</template>
```



## 核心概念

### 自动导入

以下目录中的文件会自动导入，无需手动 import：
- `components/` - UI 组件
- `composables/` - Vue 组合式函数
- `hooks/` - React/Solid hooks
- `utils/` - 工具函数

> 📖 **详细说明**：查看 [references/configuration/auto-imports.md](references/configuration/auto-imports.md) 获取自动导入的完整配置说明。

### 环境变量

在 `.env` 文件中定义：
```env
VITE_API_KEY=your_key_here
WXT_API_URL=https://api.example.com
```

在代码中使用：
```typescript
const apiKey = import.meta.env.VITE_API_KEY
const apiUrl = import.meta.env.WXT_API_URL
```

> 📖 **详细说明**：查看 [references/configuration/environment-variables.md](references/configuration/environment-variables.md) 获取环境变量的完整配置说明。

### 浏览器 API 使用

WXT 不改变浏览器扩展 API 的使用方式，需要参考：
- [Chrome 扩展文档](https://developer.chrome.com/docs/extensions)
- [Mozilla 扩展文档](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

## 配置 (Configuration)

> 📖 **详细配置文档**：所有配置相关的详细说明都在 [references/configuration/](references/configuration/) 目录。

### 配置文件总览

| 配置文件 | 用途 | 详细文档 |
|---------|------|---------|
| `wxt.config.ts` | WXT 主配置文件 | 见下方配置选项 |
| `app.config.ts` | 运行时配置 | [Runtime Config](references/configuration/runtime.md) |
| `web-ext.config.ts` | 浏览器启动配置（本地） | [Browser Startup](references/configuration/browser-startup.md) |
| `tsconfig.json` | TypeScript 配置 | [TypeScript Config](references/configuration/typescript.md) |
| `.env.*` | 环境变量 | [Environment Variables](references/configuration/environment-variables.md) |

### 配置文档目录

| 文档 | 描述 |
|------|------|
| [Manifest 配置](references/configuration/manifest.md) | manifest.json 配置、图标、权限等 |
| [浏览器启动配置](references/configuration/browser-startup.md) | 开发时浏览器行为、持久化数据等 |
| [自动导入配置](references/configuration/auto-imports.md) | unimport 配置、ESLint 集成等 |
| [环境变量配置](references/configuration/environment-variables.md) | dotenv 文件、内置变量、环境特定配置 |
| [运行时配置](references/configuration/runtime.md) | app.config.ts、useAppConfig 等 |
| [Vite 配置](references/configuration/vite.md) | Vite 插件、构建优化等 |
| [构建模式配置](references/configuration/build-mode.md) | development/production/staging 模式 |
| [TypeScript 配置](references/configuration/typescript.md) | 类型检查、严格模式、类型声明 |
| [Hooks 配置](references/configuration/hooks.md) | 构建生命周期钩子、自定义构建步骤 |
| [入口点加载器配置](references/configuration/entrypoint-loaders.md) | 自定义入口点类型 |

### wxt.config.ts 基本配置

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  // 项目结构
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  publicDir: 'public',
  outDir: '.output',

  // Manifest 配置
  manifest: {
    name: 'My Extension',
    permissions: ['storage', 'activeTab'],
  },

  // 浏览器启动配置
  webExt: {
    disabled: false,
  },

  // 自动导入配置
  imports: {
    presets: ['vue'],
    eslintrc: { enabled: 9 },
  },

  // TypeScript 配置
  typescript: {
    tsconfig: ({ mode }) => ({
      compilerOptions: {
        strict: mode === 'production',
      },
    }),
  },

  // Vite 配置
  vite: () => ({
    plugins: [],
  }),

  // Hooks
  hooks: {
    'build:done': async () => {
      console.log('Build completed!');
    },
  },
});
```

## 资源链接

- [WXT 官方文档](https://wxt.dev)
- [GitHub 仓库](https://github.com/wxt-dev/wxt)
- [示例库](https://wxt.dev/examples)

## 后续文档

此 Skill 提供的详细参考文档：

### 入口点
- [入口点详解](references/entrypoints.md) - 12 种入口点类型完整说明
- [Content Scripts](references/content-scripts.md) - **React/Vue 内容脚本渲染、createShadowRootUi、UI 定位**

### 工具 Skills
- [find-mount-point skill](../find-mount-point/Skill.md) - **通过截图 + Playwright 快速找到内容脚本的稳定挂载点**

### 核心 API
- [Extension APIs](references/extension-apis.md) - browser 导入、defineBackground、defineContentScript 等

### 资源管理
- [Assets](references/assets.md) - public/ 和 assets/ 目录、路径别名、图片处理等

### 多浏览器支持
- [Target Different Browsers](references/target-different-browsers.md) - 多浏览器构建、API 差异处理

### 国际化
- [I18n](references/i18n.md) - 国际化支持、多语言翻译

### WXT 模块
- [WXT 模块](references/wxt-modules.md) - 模块系统、扩展构建过程、自定义配置

### 配置
- [Manifest 配置](references/configuration/manifest.md) - 扩展清单配置
- [浏览器启动配置](references/configuration/browser-startup.md) - 开发浏览器行为
- [自动导入配置](references/configuration/auto-imports.md) - unimport 配置
- [环境变量配置](references/configuration/environment-variables.md) - dotenv 和环境变量
- [运行时配置](references/configuration/runtime.md) - app.config.ts 运行时配置
- [Vite 配置](references/configuration/vite.md) - Vite 构建配置
- [构建模式配置](references/configuration/build-mode.md) - dev/prod/staging 模式
- [TypeScript 配置](references/configuration/typescript.md) - 类型检查配置
- [Hooks 配置](references/configuration/hooks.md) - 构建生命周期钩子
- [入口点加载器配置](references/configuration/entrypoint-loaders.md) - 自定义入口点类型
