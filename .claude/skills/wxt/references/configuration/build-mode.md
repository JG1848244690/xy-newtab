# 构建模式配置

WXT 基于 Vite，因此以相同的方式支持模式。

---

## 指定构建模式

运行任何 dev 或 build 命令时，传递 `--mode` 参数：

```bash
wxt --mode production
wxt build --mode development
wxt zip --mode testing
```

**默认模式**：
- `wxt dev` → `development`
- `wxt build`、`wxt zip` 等 → `production`

---

## 运行时获取模式

可以使用 `import.meta.env.MODE` 在扩展中访问当前模式：

```typescript
switch (import.meta.env.MODE) {
  case 'development':
    // 开发模式逻辑
    console.log('Running in development mode');
    break;

  case 'production':
    // 生产模式逻辑
    console.log('Running in production mode');
    break;

  // 通过 --mode 指定的自定义模式
  case 'testing':
    console.log('Running in testing mode');
    break;

  case 'staging':
    console.log('Running in staging mode');
    break;

  // ...
}
```

---

## 常见使用场景

### 环境特定配置

```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  const isDev = import.meta.env.MODE === 'development';

  if (isDev) {
    // 开发环境：启用详细日志
    console.log('Debug mode enabled');
    console.log('All actions:', browser.actions);
  } else {
    // 生产环境：只记录错误
    console.error('Production mode - errors only');
  }
});
```

### API 端点配置

```typescript
// utils/api.ts
const API_ENDPOINTS = {
  development: 'http://localhost:3000',
  staging: 'https://staging-api.example.com',
  production: 'https://api.example.com',
};

const currentEndpoint = API_ENDPOINTS[import.meta.env.MODE as keyof typeof API_ENDPOINTS]
  ?? API_ENDPOINTS.production;

export async function fetchData(path: string) {
  const response = await fetch(`${currentEndpoint}${path}`);
  return response.json();
}
```

### 功能开关

```typescript
// features/analytics.ts
export const ANALYTICS_ENABLED = import.meta.env.MODE === 'production';

export function trackEvent(event: string, data?: Record<string, any>) {
  if (ANALYTICS_ENABLED) {
    // 发送分析数据
    console.log('Tracking:', event, data);
  }
}
```

---

## 结合环境变量使用

构建模式可以与环境变量结合使用，实现更灵活的配置：

**.env.development**：
```env
WXT_API_URL=http://localhost:3000
WXT_DEBUG=true
WXT_LOG_LEVEL=debug
```

**.env.production**：
```env
WXT_API_URL=https://api.example.com
WXT_DEBUG=false
WXT_LOG_LEVEL=error
```

**.env.staging**：
```env
WXT_API_URL=https://staging-api.example.com
WXT_DEBUG=false
WXT_LOG_LEVEL=info
```

**使用示例**：
```typescript
// config.ts
export const config = {
  apiUrl: import.meta.env.WXT_API_URL,
  debug: import.meta.env.WXT_DEBUG === 'true',
  logLevel: import.meta.env.WXT_LOG_LEVEL,
  mode: import.meta.env.MODE,
};

// 根据模式和环境变量配置
console.log(`Running in ${config.mode} mode`);
console.log(`API URL: ${config.apiUrl}`);
console.log(`Debug: ${config.debug}`);
```

---

## 条件构建

### 在 manifest 中使用

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: ({ mode }) => ({
    name: mode === 'development'
      ? 'My Extension (Dev)'
      : 'My Extension',
    description: mode === 'development'
      ? 'Development build - for testing only'
      : 'Production build',
  }),
});
```

### 在构建配置中使用

```typescript
// wxt.config.ts
export default defineConfig({
  vite: (configEnv) => ({
    build: {
      sourcemap: configEnv.mode === 'development',
      minify: configEnv.mode === 'production' ? 'terser' : false,
    },
  }),
});
```

---

## NPM 脚本配置

在 `package.json` 中配置不同模式的脚本：

```json
{
  "scripts": {
    "dev": "wxt dev",
    "dev:staging": "wxt --mode staging",
    "build": "wxt build",
    "build:staging": "wxt build --mode staging",
    "build:testing": "wxt build --mode testing",
    "zip": "wxt zip",
    "zip:staging": "wxt zip --mode staging"
  }
}
```

使用方式：
```bash
npm run dev              # 开发模式
npm run dev:staging      # staging 模式开发
npm run build            # 生产构建
npm run build:staging    # staging 构建
npm run zip              # 生产打包
npm run zip:staging      # staging 打包
```

---

## 模式最佳实践

### 1. 命名约定

推荐使用以下模式名称：

| 模式 | 用途 | 环境变量文件 |
|------|------|--------------|
| `development` | 本地开发 | `.env.development` |
| `production` | 生产发布 | `.env.production` |
| `staging` | 预发布测试 | `.env.staging` |
| `testing` | 测试环境 | `.env.testing` |

### 2. 默认行为

确保你的代码在生产模式下仍然工作，即使没有明确指定模式：

```typescript
// 好的做法：提供默认值
const apiUrl = import.meta.env.WXT_API_URL || 'https://api.example.com';

// 避免：假设某个模式一定存在
const apiUrl = API_ENDPOINTS[import.meta.env.MODE]; // 如果模式不匹配会失败
```

### 3. 类型安全

为自定义模式添加 TypeScript 类型：

```typescript
// types/env.d.ts
type BuildMode = 'development' | 'production' | 'staging' | 'testing';

declare global {
  interface ImportMetaEnv {
    readonly MODE: BuildMode;
  }
}

export {};
```

---

## 完整示例

**.env.development**：
```env
# 开发环境
WXT_API_URL=http://localhost:3000
WXT_DEBUG=true
WXT_ANALYTICS_ID=
```

**.env.staging**：
```env
# Staging 环境
WXT_API_URL=https://staging-api.example.com
WXT_DEBUG=false
WXT_ANALYTICS_ID=UA-XXXXXXXX-X
```

**.env.production**：
```env
# 生产环境
WXT_API_URL=https://api.example.com
WXT_DEBUG=false
WXT_ANALYTICS_ID=UA-YYYYYYYY-Y
```

**app.config.ts**：
```typescript
import { defineAppConfig } from 'wxt/sandbox';

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    apiUrl: string;
    debug: boolean;
    analyticsId: string;
  }
}

export default defineAppConfig({
  apiUrl: import.meta.env.WXT_API_URL || 'https://api.example.com',
  debug: import.meta.env.WXT_DEBUG === 'true',
  analyticsId: import.meta.env.WXT_ANALYTICS_ID || '',
});
```

**entrypoints/background.ts**：
```typescript
import { useAppConfig } from 'wxt/sandbox';

export default defineBackground(() => {
  const config = useAppConfig();
  const mode = import.meta.env.MODE;

  console.log(`Extension started in ${mode} mode`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Debug: ${config.debug}`);

  if (config.debug) {
    // 开发模式下的额外日志
    console.log('Debug mode enabled - detailed logging active');
  }
});
```

---

## 相关资源

- [WXT Build Mode 官方文档](https://wxt.dev/guide/essentials/config/build-mode.html)
- [Vite 环境变量和模式](https://vitejs.dev/guide/env-and-mode.html)
