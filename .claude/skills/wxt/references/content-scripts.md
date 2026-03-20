# Content Scripts 详解

Content Scripts 运行在网页的上下文中，但与网页的 JavaScript 隔离。

---

## 隔离机制

Content Scripts 通过以下方式与网页隔离：

- **隔离的 JavaScript 世界**：Content scripts 不能直接访问页面脚本定义的变量，页面脚本也不能访问 content scripts 的变量
- **隔离的 DOM**：Content scripts 可以访问和修改 DOM，但不能访问页面 JavaScript 对象的属性
- **Message Passing**：Content scripts 与 background scripts 和页面脚本之间的通信使用消息传递

### 生命周期

Content Scripts 生命周期从网页加载时开始，到网页关闭或扩展重载时结束。

---

## 定义 Content Script

### 文件命名约定

在 `entrypoints/` 目录中创建 content script 文件，文件名必须包含 `.content.`：

```
📂 entrypoints/
   📄 example-1.content.ts    # Content Script 1
   📄 example-2.content.ts    # Content Script 2
   📄 my-script.content.ts    # 自定义名称
```

WXT 会自动识别这些文件并注册为 content scripts。

### 基本定义

```typescript
// entrypoints/my-script.content.ts
import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    console.log('Content script loaded!');
  },
});
```

### Context（上下文对象）

`main` 函数的第一个参数是 `ctx`（上下文对象），用于管理内容脚本的生命周期：

```typescript
// entrypoints/example.content.ts
export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    // ctx 是 ContentScriptContext 类型
    console.log('Context isValid:', ctx.isValid);
  },
});
```

#### 为什么需要 Context？

大多数浏览器在扩展被卸载、更新或禁用时，**不会自动停止内容脚本**。这会导致以下错误：

```
Error: Extension context invalidated.
```

`ctx` 对象提供了工具方法来防止这个问题。

---

#### ctx 提供的辅助方法

| 方法 | 说明 |
|------|------|
| `ctx.addEventListener(target, type, listener)` | 自动清理的事件监听器 |
| `ctx.setTimeout(callback, delay)` | 自动清理的定时器 |
| `ctx.setInterval(callback, delay)` | 自动清理的间隔定时器 |
| `ctx.requestAnimationFrame(callback)` | 自动清理的动画帧 |
| `ctx.abortSignal` | 用于 fetch 等操作的 AbortSignal |

**示例**：

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    // 使用 ctx.addEventListener 代替 window.addEventListener
    // 当 context 失效时会自动移除监听器
    ctx.addEventListener(window, 'scroll', () => {
      console.log('Page scrolled');
    });

    // 使用 ctx.setTimeout 代替 window.setTimeout
    ctx.setTimeout(() => {
      console.log('Delayed task');
    }, 1000);

    // 使用 AbortSignal 取消 fetch 请求
    fetch('https://api.example.com/data', {
      signal: ctx.abortSignal,
    });
  },
});
```

---

#### 检查 Context 状态

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    // 检查 context 是否有效
    if (ctx.isValid) {
      // 安全执行操作
    }

    // 检查 context 是否已失效
    if (ctx.isInvalid) {
      // 停止正在进行的操作
      return;
    }

    // 监听 context 失效事件
    ctx.onInvalidated(() => {
      console.log('Extension context invalidated, cleaning up...');
    });
  },
});
```

---

#### 实际应用：SPA 路由监听

对于 SPA（单页应用），`ctx` 提供了 `wxt:locationchange` 事件来监听 URL 变化：

```typescript
export default defineContentScript({
  matches: ['*://www.tiktok.com/*'],

  main(ctx) {
    // 监听 URL 变化
    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      console.log('URL changed to:', newUrl?.pathname);

      // 根据新 URL 执行逻辑
      if (newUrl?.pathname.startsWith('/@')) {
        initUserPage(ctx);
      }
    });
  },
});
```

> **注意**：`wxt:locationchange` 是 WXT 提供的自定义事件，会自动在 context 失效时停止监听。

---

### 配置选项

```typescript
export default defineContentScript({
  // 匹配模式
  matches: ['*://*.example.com/*'],

  // 排除模式
  exclude_matches: ['*://*.example.com/admin/*'],

  // 运行时机
  run_at: 'document_idle',

  // 是否在所有框架中运行
  all_frames: false,

  // CSS 文件
  css: ['./styles.css'],

  // 世界隔离（MV3）
  world: 'ISOLATED',

  // CSS 注入模式
  cssInjectionMode: 'ui',

  main(ctx) {
    // Content script 逻辑
  },
});
```

---

## 匹配模式

### 基本语法

| 模式 | 匹配 |
|------|------|
| `*://*.example.com/*` | example.com 的任何 HTTP/HTTPS 页面 |
| `https://*.example.com/*` | example.com 的任何 HTTPS 页面 |
| `https://example.com/*` | example.com 的任何 HTTPS 页面（不包括子域名） |
| `https://www.example.com/*` | 只有 www.example.com |
| `<all_urls>` | 所有网页 |

### 高级模式

```typescript
export default defineContentScript({
  matches: [
    // 匹配特定域名
    '*://*.google.com/*',
    'https://example.com/*',

    // 匹配特定路径
    'https://example.com/path/*',

    // 匹配所有 URL
    '<all_urls>',
  ],

  // 排除模式
  exclude_matches: [
    '*://*.example.com/admin/*',
    'https://example.com/private/*',
  ],

  main() {
    // ...
  },
});
```

### 特殊令牌

| 令牌 | 替换为 |
|------|--------|
| `<all_urls>` | 所有网页 |
| `*` | 任何字符串 |

---

## 运行时机

```typescript
export default defineContentScript({
  // 在页面加载后立即注入（在 CSS 加载之前）
  run_at: 'document_start',

  main() {
    // DOM 还未完全加载
  },
});

export default defineContentScript({
  // 在 DOM 加载完成后注入（但在图片、框架等资源加载之前）
  run_at: 'document_end',

  main() {
    // DOM 已加载
  },
});

export default defineContentScript({
  // 在页面加载完成后注入（默认）
  run_at: 'document_idle',

  main() {
    // 页面完全加载
    // 这是最佳时机，不会影响页面性能
  },
});
```

---

## 框架注入控制

控制是否在 iframe 等子框架中注入：

```typescript
export default defineContentScript({
  // 只在主框架中运行
  all_frames: false,

  main() {
    // 不会在 iframe 中运行
  },
});

export default defineContentScript({
  // 在所有框架中运行（包括 iframe）
  all_frames: true,

  main() {
    // 会在所有 iframe 中运行
  },
});
```

---

## 世界隔离（MV3）

Manifest V3 支持在"主世界"或"隔离世界"中运行 content scripts：

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  // 在隔离的世界中运行（默认）
  world: 'ISOLATED',

  main() {
    // 不能访问页面变量
    // console.log(window.pageVariable); // undefined
  },
});

export default defineContentScript({
  matches: ['<all_urls>'],

  // 在主世界中运行
  world: 'MAIN',

  main() {
    // 可以访问页面变量
    console.log(window.pageVariable); // 可用
  },
});
```

**注意**：使用 `MAIN` 世界时，只有一个 content script 可以声明此选项，并且必须确保不与页面变量冲突。

---

## 声明全局变量

如果网页使用外部库，可以声明它们以获得类型支持：

```typescript
export default defineContentScript({
  matches: ['*://*.example.com/*'],

  globals: {
    $: {
      type: 'function',
      description: 'jQuery',
    },
    React: {
      type: 'object',
      description: 'React library',
    },
    _pageVar: {
      type: 'string',
      description: 'Page-specific variable',
    },
  },

  main() {
    // TypeScript 现在知道这些全局变量
    $('body').css('color', 'red');
    const element = React.createElement('div');
    console.log(_pageVar);
  },
});
```

---

## Content Script UI

WXT 提供了创建隔离 UI 的工具函数，确保 UI 不受网页 CSS 影响。

### CSS 注入模式

在 `defineContentScript` 中可以配置 CSS 注入模式：

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  // CSS 注入模式
  cssInjectionMode: 'ui',  // CSS 会跟随 UI 组件注入到 Shadow DOM

  async main(ctx) {
    // ...
  },
});
```

| 模式 | 说明 |
|------|------|
| `'ui'` | CSS 自动注入到 Shadow DOM，与 UI 生命周期绑定 |
| `'manual'` | 手动控制 CSS 注入 |
| `'time'` | 按时间控制 CSS 注入 |

---

### createShadowRootUi（推荐）

创建隔离的 Shadow DOM UI，**避免与页面 CSS 冲突**：

#### React 版本

```tsx
// entrypoints/my-ui.content.tsx
import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import App from '@/components/App';

export default defineContentScript({
  matches: ['https://example.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'my-extension-ui',
      position: 'inline',
      onMount: (container) => {
        // React 18+ 的挂载方式
        const root = ReactDOM.createRoot(container);
        root.render(<App />);

        // 返回 root 用于后续清理
        return root;
      },
      onRemove: (root) => {
        // 卸载 React 应用
        root?.unmount();
      },
    });

    ui.mount();
  },
});
```

#### Vue 版本

```typescript
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'my-extension-ui',
      position: 'inline',
      onMount: (container) => {
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });

    ui.mount();
  },
});
```

---

### UI 定位选项

`createShadowRootUi` 支持多种定位方式：

#### 1. 内联定位（默认）

```tsx
const ui = await createShadowRootUi(ctx, {
  name: 'my-ui',
  position: 'inline',  // 作为 body 的子元素
  onMount: (container) => { /* ... */ },
});
```

#### 2. 锚点定位（相对于某个元素）

```tsx
const ui = await createShadowRootUi(ctx, {
  name: 'my-ui',
  position: 'inline',
  anchor: document.querySelector('.target-element'),  // 目标元素
  append: 'after',  // 在目标元素之后插入
  onMount: (container) => {
    // 设置容器样式
    container.style.position = 'relative';
    container.style.zIndex = '1000';
    // ...
  },
});
```

| append 选项 | 说明 |
|------------|------|
| `'first'` | 作为第一个子元素插入 |
| `'last'` | 作为最后一个子元素插入 |
| `'before'` | 在锚点元素之前插入 |
| `'after'` | 在锚点元素之后插入 |
| `'replace'` | 替换锚点元素 |

#### 3. 覆盖层定位

```tsx
const ui = await createShadowRootUi(ctx, {
  name: 'my-overlay',
  position: 'overlay',  // 覆盖层定位
  anchor: document.querySelector('.video-player'),
  alignment: {
    horizontal: 'left',  // 'left' | 'center' | 'right'
    vertical: 'bottom',  // 'top' | 'center' | 'bottom'
  },
  onMount: (container) => { /* ... */ },
});
```

---

### 完整 React 示例：带动态更新的覆盖层

```tsx
// entrypoints/recommend.content.tsx
import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import Overlay from '@/components/Overlay';
import '~/assets/tailwind.css';

interface VideoData {
  playCount: number;
  shareCount: number;
}

export default defineContentScript({
  matches: ['https://www.tiktok.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    let currentUi: any = null;
    let currentRoot: ReactDOM.Root | null = null;

    const mountOverlay = async (data: VideoData) => {
      const playerContainer = document.querySelector('.video-player');
      if (!playerContainer) return;

      // 清理旧 UI
      if (currentUi) {
        currentUi.remove();
      }

      // 创建新 UI
      const ui = await createShadowRootUi(ctx, {
        name: 'tiktok-overlay',
        position: 'inline',
        append: 'after',
        anchor: playerContainer,
        onMount: (container) => {
          container.style.position = 'relative';
          container.style.zIndex = '1000';
          container.style.pointerEvents = 'none';

          const app = document.createElement('div');
          container.append(app);

          const root = ReactDOM.createRoot(app);
          root.render(
            <Overlay
              playCount={data.playCount}
              shareCount={data.shareCount}
            />
          );

          currentRoot = root;
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
          currentRoot = null;
        },
      });

      currentUi = ui;
      ui.mount();
    };

    // 监听数据变化
    const observer = new MutationObserver(() => {
      // 检测到变化时重新挂载
      const newData = getVideoData();
      if (newData) {
        mountOverlay(newData);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 初始挂载
    const initialData = getVideoData();
    if (initialData) {
      await mountOverlay(initialData);
    }
  },
});

function getVideoData(): VideoData | null {
  // 从页面获取数据的逻辑
  return { playCount: 1000, shareCount: 50 };
}
```

---

### createIntegratedUi

创建集成的 UI（不使用 Shadow DOM，**会被页面 CSS 影响**）：

```tsx
// React 版本
import ReactDOM from 'react-dom/client';

const ui = await createIntegratedUi(ctx, {
  name: 'my-extension-ui',
  position: 'inline',
  onMount: (container) => {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
    return root;
  },
  onRemove: (root) => {
    root?.unmount();
  },
});

ui.mount();
```

---

### createIframeUi

创建 iframe 隔离的 UI（完全隔离）：

```tsx
const ui = await createIframeUi(ctx, {
  name: 'my-extension-ui',
  position: 'inline',
  onMount: (container, iframe) => {
    // 在 iframe 内挂载 React 应用
    const iframeDoc = iframe.contentDocument!;
    const root = ReactDOM.createRoot(iframeDoc.body);
    root.render(<App />);
    return root;
  },
  onRemove: (root) => {
    root?.unmount();
  },
});

ui.mount();
```
  },
});
```

---

## 通信

Content scripts 可以与以下对象通信：
- Background scripts
- Popup/Options 等扩展页面
- 页面脚本（网页的 JavaScript）

### 与 Background 通信

**发送消息**：
```typescript
// Content Script
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // 发送消息到 background
    browser.runtime.sendMessage({
      type: 'GET_DATA',
      id: '123',
    }).then(response => {
      console.log('Response:', response);
    });
  },
});
```

**接收消息**：
```typescript
// Background Script
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'GET_DATA') {
      return Promise.resolve({ data: '...' });
    }
  });
});
```

**回复消息**：
```typescript
// Content Script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ type: 'PONG' });
    return true; // 异步响应
  }
});
```

### 与 Popup/Options 通信

Popup/Options 可以使用 tabs API 向 content script 发送消息：

```typescript
// Popup
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  // 获取当前活动标签
  browser.tabs.query({ active: true, currentWindow: true })
    .then((tabs) => {
      const tab = tabs[0];
      if (tab.id) {
        // 向 content script 发送消息
        browser.tabs.sendMessage(tab.id, {
          type: 'UPDATE',
          data: { value: 'new value' },
        });
      }
    });
});
```

### 与页面脚本通信

由于隔离的原因，content scripts 与页面脚本需要特殊方式通信。

#### 方法 1: window.postMessage

```typescript
// Content Script
export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // 监听来自页面的消息
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data.type === 'FROM_PAGE') {
        console.log('Received from page:', event.data);
      }
    });

    // 发送消息到页面
    window.postMessage({
      type: 'FROM_CONTENT',
      data: { value: 'Hello from content script!' },
    }, '*');
  },
});

// 页面脚本（在网页中运行）
window.addEventListener('message', (event) => {
  if (event.data.type === 'FROM_CONTENT') {
    console.log('Received from content script:', event.data);

    // 回复
    event.source.postMessage({
      type: 'FROM_PAGE',
      data: { value: 'Hello from page!' },
    }, '*');
  }
});
```

#### 方法 2: DOM 事件

```typescript
// Content Script
export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // 监听自定义事件
    document.addEventListener('my-custom-event', (event: any) => {
      console.log('Received:', event.detail);
    });

    // 派发事件
    document.dispatchEvent(new CustomEvent('extension-event', {
      detail: { data: 'Hello!' },
    }));
  },
});

// 页面脚本
document.addEventListener('extension-event', (event) => {
  console.log('Received from extension:', event.detail);
});
```

#### 方法 3: 注入脚本

通过编程方式注入脚本到页面：

```typescript
// Content Script
export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // 创建脚本元素
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('/injected-script.js');
    (document.head || document.documentElement).appendChild(script);

    // 或者直接注入代码
    const code = `
      (function() {
        window.pageVariable = 'Hello from page!';
      })();
    `;
    const script = document.createElement('script');
    script.textContent = code;
    document.head.appendChild(script);
  },
});
```

---

## CSS 注入

### 基本 CSS 注入

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  // 添加 CSS 文件
  css: ['./content-style.css'],

  main() {
    // CSS 会自动注入到页面
  },
});
```

### 动态 CSS 注入

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // 动态创建样式
    const style = document.createElement('style');
    style.textContent = `
      .my-extension-highlight {
        border: 2px solid red !important;
      }
    `;
    document.head.appendChild(style);
  },
});
```

---

## 完整示例

### 带状态的 Content Script

```typescript
// entrypoints/my-script.content.ts
import { defineContentScript } from 'wxt/sandbox';
import { browser } from 'wxt/browser';
import { createShadowRootUi } from 'wxt/client';

export default defineContentScript({
  matches: ['https://example.com/*'],

  main() {
    let isEnabled = true;

    // 创建 UI
    const ui = await createShadowRootUi(ctx, {
      name: 'my-extension',
      position: 'inline',
      onMount: (container, shadow) => {
        const button = document.createElement('button');
        button.textContent = 'Toggle Feature';
        button.onclick = () => {
          isEnabled = !isEnabled;
          updatePage();
          // 通知 background
          browser.runtime.sendMessage({
            type: 'TOGGLE_FEATURE',
            enabled: isEnabled,
          });
        };

        const style = document.createElement('style');
        style.textContent = `
          button {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 999999;
            padding: 8px 16px;
            background: #4285f4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
        `;
        shadow.appendChild(style);
        shadow.appendChild(button);
      },
    });

    ui.mount();

    // 监听来自 background 的消息
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'UPDATE_FEATURE') {
        isEnabled = message.enabled;
        updatePage();
      }
    });

    function updatePage() {
      if (isEnabled) {
        document.body.classList.add('my-extension-active');
      } else {
        document.body.classList.remove('my-extension-active');
      }
    }

    // 初始化
    updatePage();
  },
});
```

### 多个 Content Scripts

```typescript
// entrypoints/analytics.content.ts
export default defineContentScript({
  matches: ['<all_urls>'],
  run_at: 'document_start',
  main() {
    // 分析脚本 - 尽早运行
    console.log('Analytics initialized');
  },
});

// entrypoints/ui-enhancer.content.ts
export default defineContentScript({
  matches: ['https://example.com/*'],
  run_at: 'document_idle',
  main() {
    // UI 增强 - 页面加载后运行
    console.log('UI enhancer loaded');
  },
});
```

---

## 最佳实践

### 1. 使用隔离的 UI

始终使用 `createShadowRootUi` 或 `createIframeUi` 创建 UI，避免页面 CSS 冲突。

### 2. 明确匹配模式

使用具体的匹配模式而不是 `<all_urls>`，提高性能和安全性。

```typescript
// 推荐
matches: ['https://example.com/*'],

// 避免不必要的全局匹配
matches: ['<all_urls>'],
```

### 3. 合理选择运行时机

- `document_start`：需要尽早运行的脚本（如分析、修改 DOM 结构）
- `document_end`：需要操作 DOM 的脚本
- `document_idle`：大多数情况的最佳选择

### 4. 清理资源

在 UI 移除时清理事件监听器和资源：

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    const ui = await createShadowRootUi(ctx, {
      name: 'my-ui',
      onMount: (container) => {
        const handler = () => console.log('Clicked');
        container.addEventListener('click', handler);

        // 返回清理函数
        return () => {
          container.removeEventListener('click', handler);
        };
      },
    });
  },
});
```

---

## 相关资源

- [WXT Content Scripts 官方文档](https://wxt.dev/guide/essentials/content-scripts.html)
- [Chrome Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Mozilla Content Scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
