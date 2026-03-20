# 入口点加载器配置

入口点加载器允许你为项目添加新的入口点类型或扩展现有的入口点类型。

---

## 概述

入口点加载器负责：
1. **发现**入口点文件
2. **解析**入口点配置
3. **生成**构建代码
4. **添加**到 manifest

通过自定义加载器，你可以创建自己的入口点类型，或修改现有类型的行为。

---

## 基本结构

### 加载器接口

```typescript
interface EntrypointLoader {
  // 加载器类型名称
  type: string;

  // 发现入口点文件
  setupEntryPoints?: (ctx: SetupContext) => Promise<Entrypoint[]>;

  // 处理入口点
  handleEntrypoint?: (ctx: BuildContext) => Promise<void>;

  // 修改 manifest
  manifest?: (ctx: ManifestContext) => Manifest | Promise<Manifest>;
}
```

---

## 内置加载器

WXT 包含以下内置加载器：

| 加载器 | 类型 | 描述 |
|--------|------|------|
| `background-loader` | Background | 后台脚本/Service Worker |
| `content-script-loader` | Content Script | 注入到网页的脚本 |
| `popup-loader` | Popup | 扩展弹出页面 |
| `options-loader` | Options | 设置页面 |
| `newtab-loader` | Newtab | 新标签页 |
| `sidepanel-loader` | Side Panel | 侧边栏面板 |
| `devtools-loader` | Devtools | 开发者工具 |
| `bookmarks-loader` | Bookmarks | 书签管理器 |
| `history-loader` | History | 历史记录页面 |
| `sandbox-loader` | Sandbox | 沙盒页面 |
| `unlisted-script-loader` | Unlisted Script | 未列出脚本 |
| `unlisted-style-loader` | Unlisted Style | 未列出样式 |
| `unlisted-page-loader` | Unlisted Page | 未列出页面 |

---

## 创建自定义加载器

### 示例 1：创建自定义页面类型

创建一个自定义的"欢迎页面"入口点类型：

**wxt.config.ts**：
```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  experimental: {
    entrypointLoaders: [
      {
        type: 'welcome-page',

        // 设置入口点
        setupEntryPoints: async (ctx) => {
          const entrypointDir = ctx.wxt.srcDir + '/entrypoints';

          // 查找 welcome.* 文件
          const entrypointFile = await findEntrypointFile(
            entrypointDir,
            'welcome'
          );

          if (entrypointFile) {
            return [{
              type: 'welcome-page',
              inputPath: entrypointFile.path,
              name: 'welcome',
              options: entrypointFile.options,
            }];
          }

          return [];
        },

        // 处理构建
        handleEntrypoint: async (ctx) => {
          // 使用 Vite 处理入口点
          await buildEntrypoint(ctx);
        },

        // 修改 manifest
        manifest: (ctx) => {
          // 添加到 manifest 的 chrome_url_overrides
          return {
            chrome_url_overrides: {
              newtab: ctx.entrypoint.options.name ?? 'welcome.html',
            },
          };
        },
      },
    ],
  },
});
```

### 示例 2：创建后台脚本变体

创建一个特殊的"持久化"后台脚本：

**wxt.config.ts**：
```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  experimental: {
    entrypointLoaders: [
      {
        type: 'persistent-background',

        setupEntryPoints: async (ctx) => {
          const entrypointDir = ctx.wxt.srcDir + '/entrypoints';
          const entrypointFile = await findEntrypointFile(
            entrypointDir,
            'persistent'
          );

          return entrypointFile ? [{
            type: 'persistent-background',
            inputPath: entrypointFile.path,
            name: 'persistent',
            options: entrypointFile.options,
          }] : [];
        },

        handleEntrypoint: async (ctx) => {
          // 添加持久化标志
          ctx.entrypoint.options.persistent = true;
          await buildEntrypoint(ctx);
        },

        manifest: (ctx) => {
          return {
            background: {
              persistent: true,
              scripts: [ctx.entrypoint.options.name ?? 'persistent.js'],
            },
          };
        },
      },
    ],
  },
});
```

---

## 扩展现有加载器

### 修改 Content Script 行为

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  experimental: {
    entrypointLoaders: [
      {
        type: 'content-script',

        // 覆盖现有加载器的 manifest 处理
        manifest: (ctx) => {
          const manifest = ctx.manifest;

          // 添加自定义属性
          manifest.content_scripts ??= [];
          manifest.content_scripts.push({
            js: [ctx.entrypoint.options.name ?? 'content.js'],
            matches: ctx.entrypoint.options.matches,
            // 添加自定义选项
            match_origin_as_fallback: true,
            match_about_blank: true,
          });

          return manifest;
        },
      },
    ],
  },
});
```

---

## 上下文类型

### SetupContext

```typescript
interface SetupContext {
  wxt: Wxt;
  entrypoints: Entrypoint[];
}
```

### BuildContext

```typescript
interface BuildContext {
  wxt: Wxt;
  entrypoint: Entrypoint;
  manifest: Manifest;
}
```

### ManifestContext

```typescript
interface ManifestContext {
  wxt: Wxt;
  entrypoint: Entrypoint;
  manifest: Manifest;
}
```

---

## 完整示例：创建主题页面加载器

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';
import { resolve } from 'path';
import { readdir } from 'fs/promises';

export default defineConfig({
  experimental: {
    entrypointLoaders: [
      {
        type: 'theme-page',

        // 查找所有 theme.* 文件
        setupEntryPoints: async (ctx) => {
          const entrypoints: any[] = [];
          const entrypointDir = resolve(ctx.wxt.srcDir, 'entrypoints');

          try {
            const files = await readdir(entrypointDir);

            for (const file of files) {
              if (file.startsWith('theme.')) {
                const ext = file.split('.').pop();
                if (['tsx', 'jsx', 'vue', 'svelte', 'html'].includes(ext!)) {
                  entrypoints.push({
                    type: 'theme-page',
                    inputPath: resolve(entrypointDir, file),
                    name: 'theme',
                    options: {
                      name: `theme.${ext === 'html' ? 'html' : 'html'}`,
                    },
                  });
                }
              }
            }
          } catch (error) {
            // 目录不存在
          }

          return entrypoints;
        },

        // 构建入口点
        handleEntrypoint: async (ctx) => {
          const { wxt, entrypoint } = ctx;

          // 使用 Vite 构建入口点
          await wxt.vite.build({
            build: {
              rollupOptions: {
                input: entrypoint.inputPath,
                output: {
                  entryFileNames: entrypoint.options.name,
                },
              },
            },
          });
        },

        // 修改 manifest
        manifest: (ctx) => {
          return {
            chrome_url_overrides: {
              newtab: ctx.entrypoint.options.name ?? 'theme.html',
            },
          };
        },
      },
    ],
  },
});
```

---

## 使用场景

### 1. 添加新的入口点类型

创建 WXT 不支持的特定入口点类型：

```typescript
{
  type: 'custom-type',
  setupEntryPoints: async (ctx) => {
    // 发现自定义入口点
    return [/* ... */];
  },
  manifest: (ctx) => {
    // 添加到 manifest
    return { /* ... */ };
  },
}
```

### 2. 修改现有入口点行为

覆盖或扩展现有加载器的行为：

```typescript
{
  type: 'content-script', // 使用现有类型
  manifest: (ctx) => {
    // 自定义 manifest 生成
    return customManifest(ctx);
  },
}
```

### 3. 集成第三方框架

为特定框架创建优化的加载器：

```typescript
{
  type: 'svelte-component',
  handleEntrypoint: async (ctx) => {
    // 使用 Svelte 特定的构建选项
    await buildSvelteEntrypoint(ctx);
  },
}
```

### 4. 添加后处理步骤

在入口点构建后执行额外操作：

```typescript
{
  type: 'background',
  handleEntrypoint: async (ctx) => {
    // 执行标准构建
    await buildEntrypoint(ctx);

    // 后处理：例如生成类型定义
    await generateTypes(ctx);
  },
}
```

---

## 注意事项

1. **实验性 API**：入口点加载器是实验性功能，API 可能会变更
2. **优先级**：自定义加载器会覆盖同类型的内置加载器
3. **错误处理**：确保在加载器中正确处理错误
4. **性能**：避免在 `setupEntryPoints` 中执行耗时操作

---

## 相关资源

- [WXT Entrypoint Loaders 官方文档](https://wxt.dev/guide/essentials/config/entrypoint-loaders.html)
- [WXT Entrypoints 文档](https://wxt.dev/guide/entrypoints/)
- [WXT API Reference](https://wxt.dev/api/)
