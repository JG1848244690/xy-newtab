# 环境变量配置

WXT 支持与 Vite 相同的 dotenv 文件配置方式。

---

## Dotenv 文件

WXT 支持以下 dotenv 文件格式：

```
.env                        # 所有情况下都会加载
.env.local                  # 所有情况下都会加载，被 git 忽略
.env.[mode]                 # 特定模式下加载
.env.[mode].local           # 特定模式下加载，被 git 忽略
.env.[browser]              # 特定浏览器下加载
.env.[browser].local        # 特定浏览器下加载，被 git 忽略
.env.[mode].[browser]       # 特定模式和浏览器下加载
.env.[mode].[browser].local # 特定模式和浏览器下加载，被 git 忽略
```

**示例文件名**：
```
.env                # 基础配置
.env.local          # 本地配置（不提交到版本控制）
.env.development    # 开发环境配置
.env.production     # 生产环境配置
.env.chrome         # Chrome 浏览器配置
.env.firefox        # Firefox 浏览器配置
```

### 使用环境变量

在这些文件中列出的任何环境变量都可以在运行时使用：

```typescript
// 在代码中使用环境变量
await fetch(`/some-api?apiKey=${import.meta.env.WXT_API_KEY}`);
```

**⚠️ 重要**：必须使用 `WXT_` 或 `VITE_` 前缀，否则这些变量在运行时将不可用。这是 Vite 的约定。

**示例 .env 文件**：
```env
# 正确格式
WXT_API_KEY=your_api_key_here
WXT_APP_CLIENT_ID=your_client_id
VITE_APP_TITLE=My Extension

# 错误格式（不会在运行时可用）
API_KEY=your_api_key_here
```

---

## 内置环境变量

### WXT 提供的环境变量

WXT 根据当前命令提供一些自定义环境变量：

| 变量 | 类型 | 描述 |
|------|------|------|
| `import.meta.env.MANIFEST_VERSION` | `2 \| 3` | 目标 manifest 版本 |
| `import.meta.env.BROWSER` | `string` | 目标浏览器 |
| `import.meta.env.CHROME` | `boolean` | 等同于 `import.meta.env.BROWSER === "chrome"` |
| `import.meta.env.FIREFOX` | `boolean` | 等同于 `import.meta.env.BROWSER === "firefox"` |
| `import.meta.env.SAFARI` | `boolean` | 等同于 `import.meta.env.BROWSER === "safari"` |
| `import.meta.env.EDGE` | `boolean` | 等同于 `import.meta.env.BROWSER === "edge"` |
| `import.meta.env.OPERA` | `boolean` | 等同于 `import.meta.env.BROWSER === "opera"` |

### Vite 提供的环境变量

| 变量 | 类型 | 描述 |
|------|------|------|
| `import.meta.env.MODE` | `string` | 扩展运行的模式 |
| `import.meta.env.PROD` | `boolean` | 当 `NODE_ENV='production'` 时为 `true` |
| `import.meta.env.DEV` | `boolean` | 与 `import.meta.env.PROD` 相反 |

**不可用的 Vite 变量**：
- `import.meta.env.BASE_URL`: 在 WXT 中不可用，请使用 `browser.runtime.getURL` 代替
- `import.meta.env.SSR`: 始终为 `false`

---

## 在代码中使用示例

### 条件判断

```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  // 根据浏览器执行不同逻辑
  if (import.meta.env.FIREFOX) {
    console.log('Running on Firefox');
  } else if (import.meta.env.CHROME) {
    console.log('Running on Chrome');
  }

  // 根据模式执行不同逻辑
  if (import.meta.env.DEV) {
    console.log('Development mode - enable debug features');
  } else if (import.meta.env.PROD) {
    console.log('Production mode - optimize for performance');
  }
});
```

### API 配置

```typescript
// utils/api.ts
const API_BASE_URL = import.meta.env.WXT_API_BASE_URL || 'https://api.example.com';
const API_KEY = import.meta.env.WXT_API_KEY;

export async function fetchData(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });
  return response.json();
}
```

---

## 在 Manifest 中使用环境变量

要在 manifest 中使用环境变量，需要使用函数语法：

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: () => ({
    oauth2: {
      client_id: import.meta.env.WXT_APP_CLIENT_ID
    }
  }),
});
```

**⚠️ 重要**：WXT 在加载配置文件后才能加载 `.env` 文件。通过使用函数语法，可以延迟创建 manifest 对象，直到 `.env` 文件加载到进程之后。

**错误示例**（不会工作）：
```typescript
export default defineConfig({
  manifest: {
    // ❌ 错误：此时环境变量还未加载
    oauth2: {
      client_id: import.meta.env.WXT_APP_CLIENT_ID
    }
  },
});
```

**正确示例**：
```typescript
export default defineConfig({
  manifest: () => ({
    // ✅ 正确：使用函数语法
    oauth2: {
      client_id: import.meta.env.WXT_APP_CLIENT_ID
    }
  }),
});
```

---

## 发布环境变量

发布扩展时，WXT 会查找 `.env.publish` 和 `.env.publish.local` 文件。这些文件中的环境变量将可用于发布脚本。

**示例 .env.publish**：
```env
# Chrome Web Store 凭据
WXT_CHROME_CLIENT_ID=your_client_id
WXT_CHROME_REFRESH_TOKEN=your_refresh_token
WXT_CHROME_EXTENSION_ID=your_extension_id

# Firefox Add-ons 凭据
WXT_FIREFOX_JWT_ISSUER=your_jwt_issuer
WXT_FIREFOX_JWT_SECRET=your_jwt_secret
```

---

## 类型定义

为了让 TypeScript 识别自定义环境变量，需要在类型定义文件中声明：

```typescript
// env.d.ts
interface ImportMetaEnv {
  readonly WXT_API_KEY: string;
  readonly WXT_API_BASE_URL: string;
  readonly WXT_APP_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 最佳实践

1. **敏感信息**：永远不要将包含敏感信息的 `.env.local` 或 `.env.*.local` 文件提交到版本控制
2. **默认值**：为环境变量提供合理的默认值
3. **命名规范**：使用 `WXT_` 前缀来区分 WXT 项目特有的环境变量
4. **文档化**：在项目 README 中记录所有需要配置的环境变量

---

## 完整配置示例

**.env.development**：
```env
# 开发环境配置
WXT_API_BASE_URL=http://localhost:3000
WXT_DEBUG=true
```

**.env.production**：
```env
# 生产环境配置
WXT_API_BASE_URL=https://api.example.com
WXT_DEBUG=false
```

**.env.local**（不提交到版本控制）：
```env
# 本地配置
WXT_API_KEY=your_secret_api_key
```

**wxt.config.ts**：
```typescript
export default defineConfig({
  manifest: () => ({
    name: import.meta.env.WXT_APP_NAME || 'My Extension',
    version: import.meta.env.WXT_APP_VERSION || '1.0.0',
  }),
});
```

---

## 相关资源

- [WXT Environment Variables 官方文档](https://wxt.dev/guide/essentials/config/environment-variables.html)
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
