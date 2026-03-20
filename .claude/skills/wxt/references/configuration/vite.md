# Vite 配置

WXT 使用 Vite 作为底层打包工具来构建扩展。

> 本页面说明如何自定义项目的 Vite 配置。有关配置打包工具的更多信息，请参阅 [Vite 官方文档](https://vitejs.dev/config/)。

**提示**：大多数情况下，不应更改 Vite 的构建设置。WXT 提供了合理的默认值，在发布时会输出所有商店都接受的有效扩展。

---

## 修改 Vite 配置

可以通过 `wxt.config.ts` 文件更改 Vite 配置：

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    // 在这里覆盖配置，与 vite.config.ts 中的
    // defineConfig({ ... }) 相同
  }),
});
```

---

## 添加 Vite 插件

要添加插件，安装 NPM 包并将其添加到 Vite 配置中：

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';
import VueRouter from 'unplugin-vue-router/vite';

export default defineConfig({
  vite: () => ({
    plugins: [
      VueRouter({
        /* ... */
      }),
    ],
  }),
});
```

**⚠️ 警告**：由于 WXT 协调 Vite 构建的方式，某些插件可能无法按预期工作。

例如，`vite-plugin-remove-console` 通常只在生产构建时运行（`vite build`）。但是，WXT 在开发期间结合使用了开发服务器和构建，因此需要手动告诉它何时运行：

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';
import removeConsole from 'vite-plugin-remove-console';

export default defineConfig({
  vite: (configEnv) => ({
    plugins:
      configEnv.mode === 'production'
        ? [removeConsole({ includes: ['log'] })]
        : [],
  }),
});
```

**参数说明**：
- `configEnv.mode` - 构建模式（`'development'` 或 `'production'`）
- `configEnv.command` - 运行的命令（`'serve'` 或 `'build'`）

---

## Vite 配置函数签名

```typescript
vite: (configEnv: {
  mode: string;
  command: string;
}) => UserConfig | Promise<UserConfig>
```

---

## 常见插件配置示例

### Vue 插件

```typescript
import { defineConfig } from 'wxt';
import Vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';

export default defineConfig({
  vite: () => ({
    plugins: [
      Vue(),
      VueRouter({
        routesDir: 'src/pages',
        extensions: ['.page.vue'],
      }),
    ],
  }),
});
```

### React 插件

```typescript
import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
});
```

### 路径别名

```typescript
import { defineConfig } from 'wxt';
import { resolve } from 'path';

export default defineConfig({
  vite: () => ({
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@/components': resolve(__dirname, './src/components'),
        '@/utils': resolve(__dirname, './src/utils'),
      },
    },
  }),
});
```

### CSS 预处理器

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
  }),
});
```

### 构建优化

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    build: {
      // 生成 sourcemap
      sourcemap: true,

      // 最小化阈值
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    },
  }),
});
```

---

## 已知问题和限制

### 插件兼容性

某些插件可能在 WXT 中无法正常工作，原因包括：

1. **开发服务器与构建混合使用**：WXT 在开发模式中同时使用 dev server 和 build
2. **多个入口点**：WXT 为每个入口点创建独立的构建
3. **特殊的扩展构建要求**：扩展有特殊的文件结构和权限要求

### 解决方案

如果遇到插件问题：

1. 首先在 [GitHub Issues](https://github.com/wxt-dev/wxt/issues) 中搜索是否已有相关问题
2. 如果没有，创建新的 issue，包含：
   - 插件名称和版本
   - 最小复现示例
   - 预期行为 vs 实际行为

---

## 完整配置示例

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';
import { resolve } from 'path';
import Vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';

export default defineConfig({
  vite: (configEnv) => ({
    // 插件
    plugins: [
      Vue(),
      Components({
        dts: 'src/components.d.ts',
      }),
      AutoImport({
        dts: 'src/auto-imports.d.ts',
        imports: ['vue', 'vue-router'],
      }),

      // 仅在生产环境使用
      ...(configEnv.mode === 'production'
        ? [
            // 生产环境插件
          ]
        : []),
    ],

    // 路径别名
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },

    // CSS 配置
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },

    // 构建配置
    build: {
      sourcemap: configEnv.mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router'],
          },
        },
      },
    },

    // 服务器配置
    server: {
      port: 3000,
      strictPort: true,
    },
  }),
});
```

---

## 相关资源

- [WXT Vite 配置官方文档](https://wxt.dev/guide/essentials/config/vite.html)
- [Vite 官方配置文档](https://vitejs.dev/config/)
- [WXT GitHub Issues](https://github.com/wxt-dev/wxt/issues)
