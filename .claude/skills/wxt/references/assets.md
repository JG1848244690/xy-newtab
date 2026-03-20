# Assets 资源管理

WXT 提供了两种管理资源的方式：

- **`public/` 目录** - 静态资源，直接复制到输出目录
- **`assets/` 目录** - 需要处理的资源，会被 Vite 打包处理

---

## 静态资源 (public/)

### 基本用法

`public/` 目录中的文件会原样复制到扩展的根目录。适用于不需要处理的静态文件。

```
📂 public/
   📄 logo.png
   📄 config.json
```

构建后输出到：
```
📂 .output/chrome-mv3/
   📄 logo.png
   📄 config.json
```

### 访问静态资源

在任何代码中都可以直接访问：

```typescript
// HTML 中
<img src="/logo.png" />

// TypeScript/CSS 中
const logoUrl = '/logo.png';
background-image: url('/logo.png');
```

### 运行时获取 URL

使用 `browser.runtime.getURL` 获取完整 URL：

```typescript
import { browser } from 'wxt/browser';

const logoUrl = browser.runtime.getURL('/logo.png');
console.log(logoUrl); // "chrome-extension://xxx/logo.png"
```

---

## 处理资源 (assets/)

### 基本用法

`assets/` 目录中的资源会被 Vite 处理。适用于需要：

- 优化的图片
- 转换的 CSS
- TypeScript 转译的 JS
- 带哈希的文件名（用于缓存清除）

### 导入资源

```typescript
// 导入图片
import logoUrl from '~/assets/logo.png';

console.log(logoUrl); // "/assets/logo-abc123.png"

// 在 HTML 中使用
document.querySelector('img').src = logoUrl;

// 在 Vue 中使用
<img :src="logoUrl" />
```

### 导入样式

```typescript
// 导入 CSS
import './assets/styles.css';

// 导入 SCSS
import './assets/styles.scss';

// 导入 CSS 模块
import styles from './assets/button.module.css';
element.className = styles.button;
```

---

## 路径别名

WXT 提供了以下路径别名：

| 别名 | 解析为 | 用途 |
|------|--------|------|
| `~/` | `srcDir` 或 `rootDir` | 项目根目录 |
| `@/` | `srcDir` 或 `rootDir` | 项目根目录（与 `~/` 相同） |

### 使用路径别名

```typescript
// 假设项目结构：
// - entrypoints/
// - assets/
// - utils/

// 使用别名导入
import myUtil from '~/utils/helper';
import logo from '~/assets/logo.png';
import styles from '~/assets/styles.css';

// 等同于
import myUtil from '../../utils/helper';
```

### 配置自定义别名

在 `wxt.config.ts` 中添加自定义别名：

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
        '@/assets': resolve(__dirname, './src/assets'),
      },
    },
  }),
});
```

在 `tsconfig.json` 中同步配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/assets/*": ["./src/assets/*"]
    }
  }
}
```

---

## 图片处理

### 自动优化

Vite 会自动处理导入的图片：

```typescript
// 导入图片
import logoUrl from '~/assets/logo.png';

// Vite 会：
// 1. 优化图片大小
// 2. 添加内容哈希到文件名
// 3. 返回最终的 URL
```

### 支持的格式

- 图片：`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.avif`
- 字体：`.woff`, `.woff2`, `.eot`, `.ttf`
- 媒体：`.mp4`, `.webm`, `.ogg`, `.mp3`, `.wav`, `.flac`, `.aac`

### SVG 处理

#### 作为 URL 导入

```typescript
import logoUrl from '~/assets/logo.svg';

logoUrl; // "/assets/logo-abc123.svg"
```

#### 作为组件导入 (Vue)

```vue
<script setup lang="ts">
import LogoIcon from '~/assets/logo.svg?url';
</script>

<template>
  <img :src="LogoIcon" />
</template>
```

#### 作为原始字符串导入

```typescript
import svgString from '~/assets/logo.svg?raw';

console.log(svgString); // "<svg>...</svg>"
```

---

## CSS 资源

### 导入 CSS

```typescript
// 全局导入
import '~/assets/styles.css';

// 按需导入
import buttonStyles from '~/assets/button.css';

// CSS Modules
import styles from '~/assets/button.module.css';
```

### CSS 中的资源引用

```css
/* 相对路径引用 */
.logo {
  background-image: url('./logo.png');
}

/* 绝对路径引用 */
.hero {
  background-image: url('/hero-bg.jpg');
}

/* 别名路径引用 */
.icon {
  background-image: url('~@/assets/icon.png');
}
```

### 预处理器支持

WXT 通过 Vite 支持 CSS 预处理器：

```scss
// styles.scss
$primary-color: #3498db;

.button {
  background-color: $primary-color;
}
```

```typescript
import './styles.scss';
```

---

## JSON 资源

### 导入 JSON

```typescript
// 导入 JSON 对象
import config from '~/assets/config.json';

console.log(config.apiKey);

// 按需导入（仅导入特定字段）
import { apiKey } from '~/assets/config.json';
```

### JSON 在 public/ 中

如果 JSON 不需要被导入，可以直接放在 `public/`：

```
📂 public/
   📄 config.json
```

使用 `fetch` 读取：

```typescript
const config = await fetch('/config.json').then(r => r.json());
```

---

## Worker 资源

### Web Worker

```typescript
// worker.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module',
});

worker.postMessage('Hello');
```

### Shared Worker

```typescript
const worker = new SharedWorker(
  new URL('./shared-worker.ts', import.meta.url),
  {
    type: 'module',
  }
);
```

---

## 最佳实践

### 1. 选择正确的目录

| 场景 | 使用目录 | 原因 |
|------|----------|------|
| 图标、manifest 需要的文件 | `public/` | 需要固定路径，无需处理 |
| 需要优化的图片 | `assets/` | Vite 会优化并添加哈希 |
| 需要哈希的文件（缓存清除） | `assets/` | 自动添加内容哈希 |
| 组件样式 | `assets/` | 可以使用预处理器和模块 |
| 配置文件（运行时读取） | `public/` | 可以直接 fetch |

### 2. 使用路径别名

```typescript
// 推荐
import logo from '~/assets/logo.png';
import utils from '~/utils/helpers';

// 不推荐
import logo from '../../assets/logo.png';
import utils from '../../../utils/helpers';
```

### 3. 类型化导入

```typescript
// 为导入的资源添加类型
import logoUrl from '~/assets/logo.png';

const url: string = logoUrl; // TypeScript 知道这是字符串
```

### 4. 条件导入

```typescript
// 根据条件导入不同资源
let iconUrl;
if (isDark) {
  iconUrl = '~/assets/icon-dark.png';
} else {
  iconUrl = '~/assets/icon-light.png';
}

const icon = await import(iconUrl);
```

---

## 完整示例

### 项目结构

```
📂 {rootDir}/
   📂 public/
      📄 icon-128.png
      📄 icon-48.png
      📄 config.json
   📂 assets/
      📄 logo.png
      📄 styles.scss
      📄 button.module.css
   📂 entrypoints/
      📄 popup.ts
```

### popup.ts

```typescript
import { browser } from 'wxt/browser';
import logoUrl from '~/assets/logo.png';
import '~/assets/styles.scss';
import buttonStyles from '~/assets/button.module.css';

export default defineBackground(() => {
  // 使用导入的资源
  const img = document.createElement('img');
  img.src = logoUrl;
  document.body.appendChild(img);

  // 使用静态资源
  const config = await fetch('/config.json').then(r => r.json());
  console.log(config);

  // 使用 CSS 模块
  const button = document.createElement('button');
  button.className = buttonStyles.button;
  button.textContent = 'Click me';
  document.body.appendChild(button);

  // 获取 public 目录中的图标
  const iconUrl = browser.runtime.getURL('/icon-48.png');
  console.log(iconUrl);
});
```

---

## 相关资源

- [WXT Assets 官方文档](https://wxt.dev/guide/essentials/assets.html)
- [Vite 静态资源处理](https://vitejs.dev/guide/assets.html)
- [Vite 公共目录](https://vitejs.dev/guide/assets.html#the-public-directory)
