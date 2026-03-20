# 自动导入配置

WXT 使用 `unimport`（与 Nuxt 相同的工具）来设置自动导入功能。

---

## 基本配置

```typescript
export default defineConfig({
  // 详见 https://www.npmjs.com/package/unimport#configurations
  imports: {
    // 自定义配置
  },
});
```

---

## 默认自动导入

### WXT 内置 API

默认情况下，WXT 自动设置以下 API 的自动导入：

- `browser` - 来自 `wxt/browser`
- `defineContentScript` - 来自 `wxt/sandbox`
- `defineBackground` - 来自 `wxt/sandbox`
- `defineUnlistedScript` - 来自 `wxt/sandbox`
- `createIntegratedUi` - 来自 `wxt/client`
- `createShadowRootUi` - 来自 `wxt/client`
- `createIframeUi` - 来自 `wxt/client`
- `fakeBrowser` - 来自 `wxt/testing`
- 以及更多！

### 项目目录自动导入

WXT 会自动将以下目录添加为自动导入源：

- `<srcDir>/components/*` - UI 组件
- `<srcDir>/composables/*` - Vue 组合式函数
- `<srcDir>/hooks/*` - React/Solid hooks
- `<srcDir>/utils/*` - 工具函数

这些目录中所有文件的命名导出和默认导出都可以在项目中的任何地方直接使用，无需手动导入。

---

## TypeScript 支持

要让 TypeScript 和编辑器识别自动导入的变量，需要运行 `wxt prepare` 命令。

**建议**：将此命令添加到 `postinstall` 脚本中，这样在安装依赖后编辑器就有所有需要的信息来报告类型错误：

```json
// package.json
{
  "scripts": {
    "postinstall": "wxt prepare",
  },
}
```

---

## ESLint 集成

ESLint 默认不知道自动导入的变量，除非它们在 ESLint 的 `globals` 中明确定义。默认情况下，如果 WXT 检测到项目中安装了 ESLint，它会自动生成配置。

### ESLint 9 配置

**在 wxt.config.ts 中启用**：
```typescript
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },
});
```

**在 ESLint 配置中使用**：
```javascript
// eslint.config.mjs
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default [
  autoImports,
  {
    // 其余配置...
  },
];
```

### ESLint 8 配置

**在 wxt.config.ts 中启用**：
```typescript
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 8,
    },
  },
});
```

**在 ESLint 配置中使用**：
```javascript
// .eslintrc.mjs
export default {
  extends: ['./.wxt/eslintrc-auto-import.json'],
  // 其余配置...
};
```

---

## 禁用自动导入

如果不喜欢自动导入功能，可以将其完全禁用：

```typescript
export default defineConfig({
  imports: false,
});
```

---

## 自定义配置示例

### 添加预设

```typescript
export default defineConfig({
  imports: {
    presets: [
      'vue',
      'vueRouter',
      '@vueuse/core',
    ],
  },
});
```

### 自定义导入

```typescript
export default defineConfig({
  imports: {
    imports: [
      { from: 'lodash-es', name: 'debounce', as: 'debounce' },
      { from: 'date-fns', name: 'format', as: 'dateFormat' },
    ],
  },
});
```

### 自定义目录

```typescript
export default defineConfig({
  imports: {
    dirs: [
      'src/lib',
      'src/helpers',
    ],
  },
});
```

---

## 完整配置示例

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  imports: {
    // 启用预设
    presets: ['vue', '@vueuse/core'],

    // 自动导入目录
    dirs: [
      'components',     // UI 组件
      'composables',    // Vue 组合式函数
      'hooks',          // React/Solid hooks
      'utils',          // 工具函数
    ],

    // 自定义导入
    imports: [
      { from: 'lodash-es', name: 'debounce', as: 'debounce' },
      { from: 'lodash-es', name: 'throttle', as: 'throttle' },
    ],

    // ESLint 集成
    eslintrc: {
      enabled: 9,
    },

    // 调试模式
    debug: false,
  },
});
```

---

## 相关资源

- [WXT Auto-imports 官方文档](https://wxt.dev/guide/essentials/config/auto-imports.html)
- [unimport 文档](https://github.com/unplugin/unimport)
