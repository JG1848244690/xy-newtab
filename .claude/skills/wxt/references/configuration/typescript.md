# TypeScript 配置

类型检查在 WXT 中是必需的。这意味着如果你在代码中犯了类型错误，`wxt build` 会失败。但是，在 `wxt dev` 期间类型检查会被跳过以加快开发速度。

> **注意**：可以配置 `wxt dev` 进行类型检查。请参阅下方的"开发服务器类型检查"部分。

**⚠️ 类型检查与 Linting 的区别**：类型检查（TypeScript 编译器检查）和 Linting（ESLint/Prettier）是不同的。类型检查严格关注 TypeScript 类型，而 Linting 关注代码风格、最佳实践等。如果需要 Linting，请参阅单独的 [Linting 指南](https://wxt.dev/guide/best-practices/linting.html)。

---

## TSConfig

WXT 在初始化项目时自动生成 `tsconfig.json`。这是 WXT 的工作方式所需的基本配置：

```json
{
  "compilerOptions": {
    "types": ["wxt/client-types"],
    // ... WXT 的默认类型
  }
}
```

### 必需的类型

确保 `tsconfig.json` 中包含 `wxt/client-types`：

```json
{
  "compilerOptions": {
    "types": ["wxt/client-types"]
  }
}
```

这个包提供了对所有浏览器 API 的完整类型支持。

---

## TypeScript 编译器选项

### 在 wxt.config.ts 中配置

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  typescript: {
    // TypeScript 编译器选项
    tsconfig: ({ mode }) => ({
      compilerOptions: {
        // 根据模式自定义选项
        strict: mode === 'production',
      },
    }),
  },
});
```

---

## 开发服务器类型检查

默认情况下，`wxt dev` 不进行类型检查以加快开发速度。可以启用它：

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  dev: {
    // 启用开发服务器类型检查
    // 注意：这可能会影响开发体验
    // 因为在每次保存时都必须运行 TypeScript 编译器
    typescript: true,
  },
});
```

---

## 入口点类型定义

### Content Script 类型

Content scripts 可以声明它们注入到网页中时提供的全局变量：

```typescript
// entrypoints/example.content.ts
export default defineContentScript({
  matches: ['*://*.google.com/*'],

  // 声明 Google 网站上的全局变量
  globals: {
    google: {
      type: 'object',
      description: 'Google namespace',
    },
  },

  main() {
    // TypeScript 现在知道 `google` 是什么
    console.log(google);
  },
});
```

### 声明外部库

如果网站使用了外部库，可以这样声明：

```typescript
export default defineContentScript({
  matches: ['*://example.com/*'],

  globals: {
    $: {
      type: 'function',
      description: 'jQuery',
    },
    React: {
      type: 'object',
      description: 'React library',
    },
  },

  main() {
    // 使用类型安全的外部库
    const element = $('<div>');
    ReactDOM.render(element);
  },
});
```

---

## 类型声明文件

### 创建类型声明文件

在项目中创建类型声明文件来扩展类型：

**types/global.d.ts**：
```typescript
// 扩展 Window 对象
declare global {
  interface Window {
    myCustomProperty: string;
  }
}

export {};

// 扩展 ImportMetaEnv
interface ImportMetaEnv {
  readonly WXT_MY_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### WXT 模块扩展

**types/wxt.d.ts**：
```typescript
// 扩展 WxtAppConfig 接口
declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    theme?: 'light' | 'dark';
    apiEndpoint: string;
    enableAnalytics: boolean;
  }
}
```

---

## Vue 组件类型

### 自动获取类型

对于 Vue 单文件组件，WXT 会自动处理类型：

```vue
<script setup lang="ts">
// 类型自动推断
const count = ref(0);

// 接口可以正常使用
interface User {
  id: number;
  name: string;
}

const user = ref<User | null>(null);
</script>
```

### 模板中的类型

Vue 模板也支持类型检查：

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
}

const props = defineProps<Props>();
</script>

<template>
  <!-- TypeScript 会检查这些属性 -->
  <h1>{{ props.title }}</h1>
  <span v-if="props.count">{{ props.count }}</span>
</template>
```

---

## React 组件类型

```tsx
// entrypoints/popup.tsx
import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';

function App() {
  return <div>Hello from React!</div>;
}

export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    const root = document.createElement('div');
    document.body.append(root);
    ReactDOM.createRoot(root).render(<App />);
  },
});
```

---

## 类型安全示例

### 浏览器 API 类型

```typescript
import { browser } from 'wxt/browser';

// 类型安全的浏览器 API 使用
export default defineBackground(() => {
  // TypeScript 知道正确的签名
  browser.tabs.query({ active: true, currentWindow: true })
    .then((tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        browser.tabs.sendMessage(tab.id, { type: 'PING' });
      }
    });
});
```

### Storage API 类型

```typescript
// 定义存储类型
interface StorageSchema {
  userSettings: {
    theme: 'light' | 'dark';
    language: string;
  };
  cache: Record<string, any>;
}

// 使用类型安全的存储
export default defineBackground(() => {
  const getSettings = async (): Promise<StorageSchema['userSettings']> => {
    const result = await browser.storage.local.get('userSettings');
    return result.userSettings || { theme: 'dark', language: 'en' };
  };
});
```

### 消息传递类型

```typescript
// 定义消息类型
type Message =
  | { type: 'GET_DATA'; id: string }
  | { type: 'SET_DATA'; id: string; value: any }
  | { type: 'DELETE_DATA'; id: string };

type Response =
  | { success: true; data: any }
  | { success: false; error: string };

// Content Script
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // 类型安全的消息发送
    const sendMessage = async (): Promise<Response> => {
      return await browser.runtime.sendMessage({ type: 'GET_DATA', id: '123' });
    };
  },
});

// Background Script
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: Message, sender) => {
    if (message.type === 'GET_DATA') {
      // TypeScript 知道 message.id 存在
      return { success: true, data: { id: message.id } };
    }
  });
});
```

---

## 严格模式配置

### 启用严格类型检查

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 渐进式严格模式

如果担心启用严格模式会破坏现有代码，可以逐步启用：

```json
// tsconfig.json
{
  "compilerOptions": {
    // 第一步：启用 noImplicitAny
    "noImplicitAny": true,

    // 第二步：启用 strictNullChecks
    "strictNullChecks": true,

    // 第三步：启用完整严格模式
    "strict": true
  }
}
```

---

## 路径别名类型

配置路径别名后，需要更新 TypeScript 配置：

**wxt.config.ts**：
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

**tsconfig.json**：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

---

## 常见类型问题

### 问题 1：模块找不到

**错误**：`Cannot find module 'wxt/browser'`

**解决方案**：确保安装了 `@types/chrome` 或 `@types/firefox-webext-browser`，并在 `tsconfig.json` 中包含 `wxt/client-types`。

### 问题 2：浏览器 API 类型不正确

**错误**：某些浏览器 API 在 TypeScript 中不存在

**解决方案**：
```typescript
// 使用类型断言或扩展声明
declare global {
  interface Window {
    customAPI: any;
  }
}
```

### 问题 3：导入类型错误

**错误**：导入的模块类型不正确

**解决方案**：
```typescript
// 明确指定类型
import type { SomeType } from 'some-module';

// 或使用三斜杠指令
/// <reference types="some-module" />
```

---

## 完整配置示例

**tsconfig.json**：
```json
{
  "extends": "@wxt/tsconfig/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./types/*"]
    },
    "strict": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["wxt/client-types"]
  },
  "include": [
    "entrypoints/**/*",
    "components/**/*",
    "utils/**/*",
    "types/**/*",
    "wxt.config.ts"
  ],
  "exclude": ["node_modules", ".output", "wxt"]
}
```

**wxt.config.ts**：
```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  // 启用开发时类型检查（可选）
  dev: {
    typescript: false, // 默认 false，加快开发速度
  },

  // TypeScript 配置
  typescript: {
    tsconfig: ({ mode }) => ({
      compilerOptions: {
        // 生产模式更严格的检查
        strict: mode === 'production',
        // 开发模式生成源映射
        sourceMap: mode === 'development',
      },
    }),
  },
});
```

---

## 相关资源

- [WXT TypeScript 官方文档](https://wxt.dev/guide/essentials/config/typescript.html)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [WXT Linting 指南](https://wxt.dev/guide/best-practices/linting.html)
