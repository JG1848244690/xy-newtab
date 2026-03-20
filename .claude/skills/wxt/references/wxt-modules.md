# WXT 模块

WXT 提供了一个"模块系统"，允许你在构建过程的不同步骤运行代码来修改它。

---

## 添加模块

有两种方式向项目添加模块：

### 1. NPM 模块

安装 NPM 包，如 `@wxt-dev/auto-icons`，并将其添加到配置中：

```typescript
// wxt.config.ts
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
});
```

**搜索 WXT 模块**：在 NPM 上搜索 "wxt module" 是查找已发布的 WXT 模块的好方法。

### 2. 本地模块

在项目的 `modules/` 目录中添加文件：

```
<srcDir>/
  modules/
    my-module.ts
```

---

## 模块选项

WXT 模块可能需要或允许设置自定义选项来改变其行为。有两种类型的选项：

1. **构建时**：构建过程中使用的任何配置，如功能标志
2. **运行时**：运行时访问的任何配置，如回调函数

构建时选项放在 `wxt.config.ts` 中，而运行时选项放在 `app.config.ts` 文件中。

### 构建时选项

```typescript
// wxt.config.ts
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],

  autoIcons: {
    // 模块的构建时选项
    optimize: true,
  },
});
```

### 运行时选项

```typescript
// app.config.ts
import { defineAppConfig } from 'wxt/sandbox';

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    autoIcons?: {
      enabled: boolean;
    };
  }
}

export default defineAppConfig({
  autoIcons: {
    enabled: true,
  },
});
```

**类型支持**：如果你使用 TypeScript，模块会增强 WXT 的类型，因此如果选项缺失或不正确，你会得到类型错误。

---

## 执行顺序

模块的加载顺序与 hooks 的执行顺序相同。有关更多详细信息，请参阅 Hooks 文档。

---

## 编写模块

### 基本模块结构

这是一个基本的 WXT 模块：

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    // 你的模块代码...
  },
});
```

每个模块的 setup 函数在 `wxt.config.ts` 文件加载后执行。`wxt` 对象提供了编写模块所需的一切：

- 使用 `wxt.hook(...)` 钩入构建的生命周期并进行更改
- 使用 `wxt.config` 获取项目 `wxt.config.ts` 文件的解析配置
- 使用 `wxt.logger` 将消息记录到控制台
- 以及更多！

---

## 模块示例

### 更新解析的配置

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    wxt.hook('config:resolved', () => {
      wxt.config.outDir = 'dist';
    });
  },
});
```

### 添加构建时配置

```typescript
import { defineWxtModule } from 'wxt/modules';
import 'wxt';

export interface MyModuleOptions {
  // 在这里添加你的构建时选项...
  featureFlag?: boolean;
  apiKey?: string;
}

declare module 'wxt' {
  export interface InlineConfig {
    // 为 wxt.config.ts 中的 "myModule" 键添加类型
    myModule?: MyModuleOptions;
  }
}

export default defineWxtModule<MyModuleOptions>({
  configKey: 'myModule',

  // 构建时配置通过 setup 的第二个参数可用
  setup(wxt, options) {
    console.log('Module options:', options);

    if (options?.featureFlag) {
      // 启用功能
    }

    if (options?.apiKey) {
      // 使用 API 密钥
    }
  },
});
```

### 添加运行时配置

```typescript
import { defineWxtModule } from 'wxt/modules';
import 'wxt/sandbox';

export interface MyModuleRuntimeOptions {
  enabled?: boolean;
  callback?: () => void;
}

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    myModule?: MyModuleRuntimeOptions;
  }
}

export default defineWxtModule({
  setup(wxt) {
    // 运行时选项在运行时可用
  },
});
```

运行时选项在调用时返回：

```typescript
// 在扩展代码中
import { useAppConfig } from 'wxt/sandbox';

const config = useAppConfig();
console.log(config.myModule); // { enabled: true, callback: ... }
```

这在生成运行时代码时非常有用。

### 生成输出文件

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    // 相对于输出目录
    const generatedFilePath = 'some-file.txt';

    wxt.hook('build:publicAssets', (_, assets) => {
      assets.push({
        relativeDest: generatedFilePath,
        contents: 'some generated text',
      });
    });

    wxt.hook('build:manifestGenerated', (_, manifest) => {
      manifest.web_accessible_resources ??= [];
      manifest.web_accessible_resources.push({
        matches: ['*://*'],
        resources: [generatedFilePath],
      });
    });
  },
});
```

此文件可以在运行时加载：

```typescript
const res = await fetch(browser.runtime.getURL('/some-text.txt'));
```

### 添加自定义入口点

当 `entrypoints/` 目录下的现有文件被发现后，`entrypoints:found` 钩子可用于添加自定义入口点。

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    wxt.hook('entrypoints:found', (_, entrypointInfos) => {
      // 添加新的入口点
      entrypointInfos.push({
        name: 'my-custom-script',
        inputPath: 'path/to/custom-script.js',
        type: 'content-script',
      });
    });
  },
});
```

### 生成运行时模块

在 `.wxt` 中创建文件，添加别名以导入它，并为导出的变量添加自动导入。

```typescript
import { defineWxtModule } from 'wxt/modules';
import { resolve } from 'node:path';

export default defineWxtModule({
  imports: [
    // 添加自动导入
    { from: '#analytics', name: 'analytics' },
    { from: '#analytics', name: 'reportEvent' },
    { from: '#analytics', name: 'reportPageView' },
  ],

  setup(wxt) {
    const analyticsModulePath = resolve(
      wxt.config.wxtDir,
      'analytics/index.ts',
    );
    const analyticsModuleCode = `
      import { createAnalytics } from 'some-module';

      export const analytics = createAnalytics(useAppConfig().analytics);
      export const { reportEvent, reportPageView } = analytics;
    `;

    // 添加别名
    wxt.config.vite = wxt.config.vite || (() => ({}));
    const originalVite = wxt.config.vite;
    wxt.config.vite = (...args) => {
      const config = originalVite(...args);
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['#analytics'] = analyticsModulePath;
      return config;
    };

    wxt.hook('prepare:types', async (_, entries) => {
      entries.push({
        path: analyticsModulePath,
        text: analyticsModuleCode,
      });
    });
  },
});
```

### 生成声明文件

```typescript
import { defineWxtModule } from 'wxt/modules';
import { resolve } from 'node:path';

export default defineWxtModule({
  setup(wxt) {
    const typesCode = `
      // 声明全局类型，执行类型扩展
      declare global {
        interface Window {
          myCustomProperty: string;
        }
      }
      export {};
    `;

    wxt.hook('prepare:types', async (_, entries) => {
      entries.push({
        path: 'my-module/types.d.ts',
        text: typesCode,
        // 重要 - 没有这一行，你的声明文件将不会是 TS 项目的一部分：
        tsReference: true,
      });
    });
  },
});
```

### 修改 Manifest

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    wxt.hook('build:manifestGenerated', (_, manifest) => {
      // 添加权限
      manifest.permissions ??= [];
      manifest.permissions.push('clipboardRead');

      // 添加主机权限
      manifest.host_permissions ??= [];
      manifest.host_permissions.push('https://api.example.com/*');

      // 修改名称
      if (wxt.mode === 'development') {
        manifest.name = `${manifest.name} (Dev)`;
      }
    });
  },
});
```

---

## 完整模块示例

### 分析模块

```typescript
// modules/analytics.ts
import { defineWxtModule } from 'wxt/modules';
import 'wxt';
import 'wxt/sandbox';

// 构建时选项
export interface AnalyticsModuleOptions {
  trackingId?: string;
  debug?: boolean;
}

// 运行时选项
export interface AnalyticsRuntimeOptions {
  enabled?: boolean;
  userId?: string;
}

declare module 'wxt' {
  export interface InlineConfig {
    analytics?: AnalyticsModuleOptions;
  }
}

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    analytics?: AnalyticsRuntimeOptions;
  }
}

export default defineWxtModule<AnalyticsModuleOptions>({
  configKey: 'analytics',

  imports: [
    { from: '#analytics', name: 'trackEvent' },
    { from: '#analytics', name: 'trackPageView' },
  ],

  setup(wxt, buildOptions) {
    const trackingId = buildOptions?.trackingId;
    const debug = buildOptions?.debug ?? false;

    // 生成运行时分析代码
    const analyticsCode = `
      let analyticsEnabled = true;
      let trackingId = '${trackingId}';

      export function trackEvent(eventName: string, data?: Record<string, any>) {
        if (!analyticsEnabled) return;
        console.log('[Analytics] Event:', eventName, data);
        // 发送到分析服务
      }

      export function trackPageView(path: string) {
        if (!analyticsEnabled) return;
        console.log('[Analytics] Page View:', path);
        // 发送到分析服务
      }

      export function disableAnalytics() {
        analyticsEnabled = false;
      }

      export function setTrackingId(id: string) {
        trackingId = id;
      }
    `;

    // 添加别名
    wxt.config.vite = wxt.config.vite || (() => ({}));
    const originalVite = wxt.config.vite;
    wxt.config.vite = (...args) => {
      const config = originalVite(...args);
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['#analytics'] = resolve(
        wxt.config.wxtDir,
        'analytics.ts'
      );
      return config;
    };

    // 生成类型文件
    wxt.hook('prepare:types', async (_, entries) => {
      entries.push({
        path: 'analytics.ts',
        text: analyticsCode,
      });
    });
  },
});
```

使用：

```typescript
// wxt.config.ts
export default defineConfig({
  modules: ['./modules/analytics'],

  analytics: {
    trackingId: 'GA-XXXXXXXXX',
    debug: true,
  },
});

// app.config.ts
export default defineAppConfig({
  analytics: {
    enabled: true,
    userId: 'user-123',
  },
});

// 在任何地方使用
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // 自动导入的函数
    trackEvent('page_loaded');
    trackPageView('/home');
  },
});
```

---

## 示例模块

你应该查看其他人编写和发布的模块代码。以下是一些示例：

- `@wxt-dev/auto-icons` - 自动生成图标
- `@wxt-dev/i18n` - 国际化支持
- `@wxt-dev/module-vue` - Vue 框架支持
- `@wxt-dev/module-solid` - SolidJS 框架支持
- `@wxt-dev/module-react` - React 框架支持
- `@wxt-dev/module-svelte` - Svelte 框架支持

---

## 最佳实践

### 1. 类型安全

始终为模块选项定义类型：

```typescript
export interface MyModuleOptions {
  // 清晰的类型定义
  enabled?: boolean;
  apiKey?: string;
}
```

### 2. 默认值

为选项提供合理的默认值：

```typescript
setup(wxt, options) {
  const enabled = options?.enabled ?? true;
  const apiKey = options?.apiKey ?? 'default-key';
}
```

### 3. 错误处理

在模块中正确处理错误：

```typescript
setup(wxt, options) {
  try {
    // 模块逻辑
  } catch (error) {
    wxt.logger.error('Module error:', error);
  }
}
```

### 4. 文档

为你的模块提供清晰的文档：

- 安装说明
- 配置选项说明
- 使用示例
- 类型定义

### 5. 测试

确保你的模块在不同场景下都能正常工作：

- 不同的构建模式
- 不同的浏览器
- 有/无选项配置

---

## 相关资源

- [WXT Modules 官方文档](https://wxt.dev/guide/essentials/wxt-modules.html)
- [WXT Hooks 文档](references/configuration/hooks.md)
- [在 NPM 上搜索 WXT 模块](https://www.npmjs.com/search?q=wxt+module)
