# 运行时配置

> 此 API 仍在开发中，更多功能即将推出！

运行时配置允许在单个位置定义配置，并在扩展的运行时访问这些配置。

---

## 定义配置

在 `<srcDir>/app.config.ts` 文件中定义运行时配置：

```typescript
import { defineAppConfig } from 'wxt/sandbox';

// 定义配置的类型
declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    theme?: 'light' | 'dark';
    apiEndpoint?: string;
    debugMode?: boolean;
  }
}

export default defineAppConfig({
  theme: 'dark',
});
```

**⚠️ 警告**：此文件会提交到仓库中，所以不要在这里放置任何敏感信息。应使用环境变量代替。

---

## 访问配置

WXT 提供了 `useAppConfig` 函数来访问运行时配置：

```typescript
import { useAppConfig } from 'wxt/sandbox';

export default defineBackground(() => {
  const config = useAppConfig();
  console.log(config.theme); // "dark"
});
```

---

## 在 App Config 中使用环境变量

可以在 `app.config.ts` 文件中使用环境变量：

```typescript
declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    apiKey?: string;
    skipWelcome: boolean;
    apiEndpoint: string;
  }
}

export default defineAppConfig({
  apiKey: import.meta.env.WXT_API_KEY,
  skipWelcome: import.meta.env.WXT_SKIP_WELCOME === 'true',
  apiEndpoint: import.meta.env.WXT_API_ENDPOINT || 'https://api.example.com',
});
```

这样做有以下优势：
- 在单个文件中定义所有预期的环境变量
- 将字符串转换为其他类型，如布尔值或数组
- 在未提供环境变量时提供默认值

---

## 完整示例

```typescript
// app.config.ts
import { defineAppConfig } from 'wxt/sandbox';

// 定义配置类型
declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    // 应用设置
    theme: 'light' | 'dark' | 'auto';
    language: string;

    // API 配置
    apiEndpoint: string;
    apiTimeout: number;

    // 功能开关
    features: {
      analytics: boolean;
      notifications: boolean;
      betaFeatures: boolean;
    };

    // 调试选项
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  }
}

export default defineAppConfig({
  // 应用设置
  theme: import.meta.env.WXT_THEME || 'auto',
  language: import.meta.env.WXT_LANGUAGE || 'en',

  // API 配置
  apiEndpoint: import.meta.env.WXT_API_ENDPOINT || 'https://api.example.com',
  apiTimeout: parseInt(import.meta.env.WXT_API_TIMEOUT || '5000'),

  // 功能开关
  features: {
    analytics: import.meta.env.WXT_ENABLE_ANALYTICS === 'true',
    notifications: import.meta.env.WXT_ENABLE_NOTIFICATIONS !== 'false',
    betaFeatures: import.meta.env.WXT_ENABLE_BETA === 'true',
  },

  // 调试选项
  debugMode: import.meta.env.MODE === 'development',
  logLevel: import.meta.env.WXT_LOG_LEVEL || 'info',
});
```

---

## 在不同入口点中使用

### Background 脚本

```typescript
// entrypoints/background.ts
import { useAppConfig } from 'wxt/sandbox';

export default defineBackground(() => {
  const config = useAppConfig();

  if (config.debugMode) {
    console.log('Debug mode enabled');
    console.log('Config:', config);
  }
});
```

### Content Script

```typescript
// entrypoints/content.ts
import { useAppConfig } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const config = useAppConfig();

    // 根据主题应用样式
    if (config.theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  },
});
```

### Popup (Vue)

```vue
<!-- entrypoints/popup.vue -->
<script setup lang="ts">
import { useAppConfig } from 'wxt/sandbox';

const config = useAppConfig();
</script>

<template>
  <div :class="`theme-${config.theme}`">
    <h1>{{ config.language }}</h1>
  </div>
</template>
```

---

## 配置文件位置

默认情况下，WXT 在以下位置查找配置文件：
- `<srcDir>/app.config.ts` - 主要位置
- `<rootDir>/app.config.ts` - 如果不使用 `srcDir`

可以通过 `wxt.config.ts` 中的 `appConfig` 选项自定义位置：

```typescript
export default defineConfig({
  appConfig: 'src/config/app.ts',
});
```

---

## TypeScript 支持

为了获得完整的类型支持，需要扩展 `WxtAppConfig` 接口：

```typescript
// app.config.ts
declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    // 在这里添加你的配置属性
    myCustomProperty: string;
  }
}
```

这样，在使用 `useAppConfig()` 时就会获得完整的类型提示和自动补全。

---

## 最佳实践

1. **单一来源**：将所有运行时配置集中在一个文件中
2. **类型安全**：始终定义配置的类型
3. **默认值**：为所有配置提供合理的默认值
4. **环境变量**：使用环境变量来覆盖默认值
5. **无敏感信息**：不要在配置文件中存储 API 密钥等敏感信息

---

## 相关资源

- [WXT Runtime Config 官方文档](https://wxt.dev/guide/essentials/config/runtime.html)
- [WXT 环境变量文档](https://wxt.dev/guide/essentials/config/environment-variables.html)
