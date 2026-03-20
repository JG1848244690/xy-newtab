# 入口点详细说明

入口点位于 `entrypoints/` 目录，是扩展的核心文件。WXT 会将这些文件打包到扩展中。

## 入口点定义方式

入口点可以是单文件或目录结构：

```
📂 entrypoints/
   📄 {name}.{ext}          # 单文件方式

# 或

📂 entrypoints/
   📂 {name}/               # 目录方式
      📄 index.{ext}
```

**注意**：不要将相关文件直接放在 `entrypoints/` 目录下，WXT 会尝试将它们作为入口点构建，可能导致错误。应使用目录结构。

### 使用目录结构的示例

当使用目录结构时，可以在 `index` 文件旁添加相关文件：

```
📂 entrypoints/
   📂 popup/
      📄 index.html     ← 入口点文件
      📄 main.ts
      📄 style.css
   📂 background/
      📄 index.ts       ← 入口点文件
      📄 alarms.ts
      📄 messaging.ts
   📂 youtube.content/
      📄 index.ts       ← 入口点文件
      📄 style.css
```

---

## 入口点类型总览

WXT 支持两种入口点类型：
- **Listed（已列出）**：在 `manifest.json` 中引用
- **Unlisted（未列出）**：不在 manifest 中引用，但在扩展中使用

**Listed 入口点**：
- Popup
- Options
- Background
- Content Script
- Newtab
- Bookmarks / History
- Devtools
- Side Panel

**Unlisted 入口点**：
- Unlisted Pages
- Unlisted Scripts
- Unlisted CSS
- Sandbox

---

## 入口点类型详解

### 1. Background（后台脚本）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/background.[jt]s` | `/background.js` |
| `entrypoints/background/index.[jt]s` | `/background.js` |

**基础用法**：
```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  // 后台脚本加载时执行
});
```

**完整配置**：
```typescript
export default defineBackground({
  // Manifest 选项
  persistent: undefined | true | false,  // MV2: 是否持久化
  type: undefined | 'module',            // MV3: 模块类型

  // 构建时包含/排除特定浏览器
  include: undefined | string[],
  exclude: undefined | string[],

  main() {
    // 后台脚本加载时执行（不能是 async）
  },
});
```

**注意事项**：
- MV2 中作为背景页脚本
- MV3 中变为 Service Worker
- WXT 会在构建时导入此文件，运行时代码必须放在 `main` 函数内

**错误示例**：
```typescript
// ❌ 错误：运行时代码不能放在 main 函数外
browser.action.onClicked.addListener(() => {
  // ...
});

export default defineBackground(() => {
  // ...
});
```

**正确示例**：
```typescript
// ✅ 正确：运行时代码放在 main 函数内
export default defineBackground(() => {
  browser.action.onClicked.addListener(() => {
    // ...
  });
});
```

---

### 2. Content Script（内容脚本）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/content.[jt]sx?` | `/content-scripts/content.js` |
| `entrypoints/{name}.content.[jt]sx?` | `/content-scripts/{name}.js` |
| `entrypoints/{name}.content/index.[jt]sx?` | `/content-scripts/{name}.js` |

**完整配置**：
```typescript
export default defineContentScript({
  // === Manifest 选项 ===
  matches: string[],                      // 必需：匹配的 URL 模式
  excludeMatches: undefined | string[],   // 排除的 URL
  includeGlobs: undefined | string[],     // 包含的 glob 模式
  excludeGlobs: undefined | string[],     // 排除的 glob 模式
  allFrames: undefined | boolean,         // 是否注入所有框架
  runAt: undefined | 'document_start' | 'document_end' | 'document_idle',
  matchAboutBlank: undefined | boolean,
  matchOriginAsFallback: undefined | boolean,
  world: undefined | 'ISOLATED' | 'MAIN', // 执行上下文

  // === 构建选项 ===
  include: undefined | string[],
  exclude: undefined | string[],

  // === CSS 注入模式 ===
  cssInjectionMode: undefined | "manifest" | "manual" | "ui",

  // === 注册方式 ===
  registration: undefined | "manifest" | "runtime",

  main(ctx: ContentScriptContext) {
    // 内容脚本加载时执行（可以是 async）
  },
});
```

**选项说明**：

| 选项 | 说明 |
|------|------|
| `matches` | 必需。指定内容脚本应该注入到哪些页面 |
| `excludeMatches` | 排除的 URL 模式 |
| `allFrames` | 是否注入到页面中的所有框架，而不仅仅是顶层框架 |
| `runAt` | 控制脚本何时注入：`document_start`、`document_end`、`document_idle` |
| `world` | 执行上下文：`ISOLATED`（隔离环境）或 `MAIN`（主世界） |
| `cssInjectionMode` | CSS 注入模式：`manifest`（通过 manifest）、`manual`（手动）、`ui`（使用 UI） |
| `registration` | 注册方式：`manifest`（静态）或 `runtime`（动态注册） |

**注意事项**：
- WXT 会在构建时导入此文件，运行时代码必须放在 `main` 函数内

---

### 3. Popup（弹出页）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/popup.html` | `/popup.html` |
| `entrypoints/popup/index.html` | `/popup.html` |

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- 设置默认标题 -->
    <title>Default Popup Title</title>

    <!-- 自定义 manifest 选项 -->
    <meta name="manifest.default_icon" content='{"16": "/icon-16.png", "24": "/icon-24.png"}' />
    <meta name="manifest.type" content="page_action|browser_action" />
    <meta name="manifest.browser_style" content="true|false" />

    <!-- 构建时包含/排除 -->
    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['firefox', ...]" />
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

**Meta 标签说明**：

| Meta 标签 | 说明 |
|-----------|------|
| `manifest.default_icon` | 设置扩展图标的路径和尺寸 |
| `manifest.type` | MV2 中设置类型为 `page_action` 或 `browser_action` |
| `manifest.browser_style` | 是否使用浏览器原生样式 |
| `manifest.include` | 仅在指定浏览器构建中包含 |
| `manifest.exclude` | 从指定浏览器构建中排除 |

---

### 4. Options（选项页）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/options.html` | `/options.html` |
| `entrypoints/options/index.html` | `/options.html` |

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Options Title</title>

    <!-- Manifest 选项 -->
    <meta name="manifest.open_in_tab" content="true|false" />
    <meta name="manifest.chrome_style" content="true|false" />
    <meta name="manifest.browser_style" content="true|false" />

    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['firefox', ...]" />
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

**Meta 标签说明**：

| Meta 标签 | 说明 |
|-----------|------|
| `manifest.open_in_tab` | 是否在新标签页中打开选项页 |
| `manifest.chrome_style` | 是否使用 Chrome 原生样式 |
| `manifest.browser_style` | 是否使用浏览器原生样式 |

---

### 5. Newtab（新标签页）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/newtab.html` | `/newtab.html` |
| `entrypoints/newtab/index.html` | `/newtab.html` |

覆盖浏览器的新标签页。当用户打开新标签页时，将显示你的自定义页面。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My New Tab Page</title>

    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['firefox', ...]" />
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

---

### 6. Side Panel（侧边栏）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/sidepanel.html` | `/sidepanel.html` |
| `entrypoints/{name}.sidepanel.html` | `/{name}.html` |

Chrome 使用 `side_panel` API，Firefox 使用 `sidebar_action` API。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Default Side Panel Title</title>

    <meta name="manifest.default_icon" content='{"16": "/icon-16.png", "24": "/icon-24.png"}' />
    <meta name="manifest.open_at_install" content="true|false" />
    <meta name="manifest.browser_style" content="true|false" />

    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['firefox', ...]" />
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

---

### 7. Devtools（开发者工具）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/devtools.html` | `/devtools.html` |

用于添加自定义开发者工具面板和窗格。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Devtools</title>

    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['firefox', ...]" />
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

---

### 8. Bookmarks / History（书签/历史记录页）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/bookmarks.html` | `/bookmarks.html` |
| `entrypoints/history.html` | `/history.html` |

覆盖浏览器的默认书签/历史记录页面。

**注意**：这些功能仅在支持覆盖这些页面的浏览器中可用（主要是 Chrome）。

---

### 9. Sandbox（沙盒页面）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/sandbox.html` | `/sandbox.html` |
| `entrypoints/{name}.sandbox.html` | `/{name}.html` |

**仅 Chromium 支持**，Firefox 不支持沙盒页面。

沙盒页面在隔离的上下文中运行，无法访问扩展 API。这对于需要处理不受信任内容的场景很有用。

---

### 10. Unlisted Pages（未列出页面）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/{name}.html` | `/{name}.html` |
| `entrypoints/{name}/index.html` | `/{name}.html` |

运行时可通过 `browser.runtime.getURL('/{name}.html')` 访问。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Title</title>

    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['firefox', ...]" />
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

**使用示例**：
```typescript
// 在 background 或其他脚本中
const url = browser.runtime.getURL('welcome.html');
console.log(url); // "chrome-extension://{id}/welcome.html"
window.open(url); // 在新标签页中打开
```

---

### 11. Unlisted Scripts（未列出脚本）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/{name}.[jt]sx?` | `/{name}.js` |
| `entrypoints/{name}/index.[jt]sx?` | `/{name}.js` |

**基础用法**：
```typescript
export default defineUnlistedScript(() => {
  // 脚本加载时执行
});
```

**完整配置**：
```typescript
export default defineUnlistedScript({
  include: undefined | string[],
  exclude: undefined | string[],
  main() {
    // 脚本加载时执行
  },
});
```

运行时可通过 `browser.runtime.getURL('/{name}.js')` 访问。

**使用示例**：
```typescript
// 在 content script 中动态注入脚本
const scriptUrl = browser.runtime.getURL('injected.js');
const script = document.createElement('script');
script.src = scriptUrl;
document.head.appendChild(script);
```

**注意事项**：
- 你需要自己加载/运行这些脚本
- 如果需要，不要忘记将脚本和/或相关资源添加到 `web_accessible_resources`
- 运行时代码必须放在 `main` 函数内

---

### 12. Unlisted CSS（未列出样式）

| 文件名 | 输出路径 |
|--------|----------|
| `entrypoints/{name}.(css\|scss\|sass\|less\|styl\|stylus)` | `/{name}.css` |
| `entrypoints/{name}/index.(css\|scss\|sass\|less\|styl\|stylus)` | `/{name}.css` |
| `entrypoints/content.(css\|scss\|sass\|less\|styl\|stylus)` | `/content-scripts/content.css` |
| `entrypoints/{name}.content.(css\|scss\|sass\|less\|styl\|stylus)` | `/content-scripts/{name}.css` |

CSS 入口点始终是未列出的。要将 CSS 添加到内容脚本，请参考 Content Script 文档。

```css
/* entrypoints/styles.css */
body {
  background-color: #f0f0f0;
}
```

**使用示例**：
```typescript
// 在 content script 中动态注入 CSS
const cssUrl = browser.runtime.getURL('styles.css');
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = cssUrl;
document.head.appendChild(link);
```

---

## 深度嵌套限制

与 Nuxt 或 Next.js 的 `pages/` 目录不同，`entrypoints/` **不支持深度嵌套**。

入口点必须是零层或一层深度，WXT 才能发现和构建它们：

```
📂 entrypoints/
   📂 youtube/
       📂 content/          # ❌ 错误：深度嵌套
          📄 index.ts
   📂 youtube.content/      # ✅ 正确：使用命名约定
      📄 index.ts
```

---

## 定义 Manifest 选项

大多数已列出的入口点都有需要在 `manifest.json` 中定义的选项。在 WXT 中，你不需要在单独的文件中定义这些选项，而是**在入口点文件本身内部定义**。

### TypeScript/JavaScript 入口点

使用 `defineXxx` 函数的配置对象：

```typescript
export default defineContentScript({
  matches: ['*://*.wxt.dev/*'],
  main() {
    // ...
  },
});
```

### HTML 入口点

使用 `<meta>` 标签：

```html
<!doctype html>
<html lang="en">
  <head>
    <!-- MV2 中使用 page_action -->
    <meta name="manifest.type" content="page_action" />
  </head>
</html>
```

---

## 相关资源

- [WXT 入口点官方文档](https://wxt.dev/guide/essentials/entrypoints.html)
- [Chrome 扩展文档](https://developer.chrome.com/docs/extensions)
- [Mozilla 扩展文档](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
