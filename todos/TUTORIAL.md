# WXT 浏览器扩展项目搭建教程

> 本教程基于 `tiktok-analytics` 项目，详细讲解如何从零搭建一个类似的 WXT + React + TypeScript 浏览器扩展项目。

## 目录

- [1. 项目初始化](#1-项目初始化)
- [2. WXT 框架基础](#2-wxt-框架基础)
- [3. 项目结构](#3-项目结构)
- [4. 核心功能开发](#4-核心功能开发)
- [5. E2E 测试配置](#5-e2e-测试配置)
- [6. 常用命令](#6-常用命令)

---

## 1. 项目初始化

### 1.1 使用 WXT 官方模板创建项目

```bash
# 使用 pnpm (推荐)
pnpm dlx wxt@latest init

# Tailwind CSS v4
pnpm add -D tailwindcss @tailwindcss/vite

# 常用工具库
pnpm add dayjs clsx tailwind-merge lucide-react

# 消息通信
pnpm add @webext-core/messaging

# 存储
pnpm add @wxt-dev/storage

# fetch 拦截 (如需拦截网络请求)
pnpm add fetch-intercept whatwg-fetch
```

### 1.4 完整 package.json 示例

```json
{
  "name": "my-extension",
  "description": "浏览器扩展描述",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build -b chrome",
    "build:dev": "wxt build -b chrome -m development",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "compile": "tsc --noEmit",
    "postinstall": "wxt prepare",
    "test:e2e": "playwright test --config=e2e/playwright.config.ts",
    "test:e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui",
    "test:e2e:report": "playwright show-report"
  },
  "dependencies": {
    "@webext-core/messaging": "^2.3.0",
    "@wxt-dev/storage": "^1.2.8",
    "clsx": "^2.1.1",
    "dayjs": "^1.11.19",
    "fetch-intercept": "^2.4.0",
    "lucide-react": "^0.577.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "tailwind-merge": "^3.5.0",
    "whatwg-fetch": "^3.6.20"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2",
    "@tailwindcss/vite": "^4.2.1",
    "@types/node": "^25.5.0",
    "@types/react": "^19.2.13",
    "@types/react-dom": "^19.2.3",
    "@wxt-dev/module-react": "^1.1.5",
    "playwright": "^1.58.2",
    "tailwindcss": "^4.2.1",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "wxt": "^0.20.18"
  }
}
```

---

## 2. WXT 框架基础

### 2.1 配置文件 wxt.config.ts

```typescript
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // WXT 模块
  modules: ['@wxt-dev/module-react'],

  // Vite 插件配置
  vite: () => ({
    plugins: [tailwindcss() as unknown as Plugin],
  }),

  // Manifest 配置
  manifest: {
    name: 'My Extension',
    permissions: ['storage'],  // 扩展权限
    host_permissions: ['*://*.example.com/*'],  // 目标网站
  },
});
```

### 2.2 tsconfig.json

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "jsx": "react-jsx"
  },
  "exclude": ["e2e/**/*"]
}
```

### 2.3 WXT 自动导入

WXT 自动导入以下全局函数，无需手动 import：

```typescript
// 入口点定义
defineContentScript()  // 定义内容脚本
defineBackground()     // 定义后台脚本
browser                // webextension-polyfill (代替 chrome.*)
createShadowRootUi()   // 创建 Shadow DOM UI

// 路径别名
@/  // 项目根目录
~/  // 项目根目录 (同上)
```

---

## 3. 项目结构

```
my-extension/
├── entrypoints/              # WXT 入口点 (核心目录)
│   ├── background.ts         # 后台脚本
│   ├── main.content.tsx      # 主内容脚本 (路由入口)
│   ├── fetch-inject.content.ts  # fetch 拦截脚本 (MAIN world)
│   └── popup/                # Popup 入口
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
│
├── src/
│   ├── content/              # 页面处理器
│   │   ├── types.ts          # 类型定义、页面检测
│   │   ├── cleanup.ts        # 页面清理
│   │   ├── recommend.tsx     # 推荐页处理
│   │   ├── user.tsx          # 用户主页处理
│   │   ├── video.tsx         # 视频页处理
│   │   └── explore.tsx       # 探索页处理
│   │
│   ├── components/           # React 组件
│   │   ├── DataOverlay.tsx   # 数据覆盖层
│   │   ├── ui/               # UI 组件
│   │   └── ...
│   │
│   ├── hooks/                # React Hooks
│   ├── utils/                # 工具函数
│   │   ├── constants.ts      # 常量定义
│   │   ├── types.ts          # 类型定义
│   │   ├── format.ts         # 格式化工具
│   │   └── cn.ts             # className 合并
│   │
│   └── assets/
│       └── tailwind.css      # Tailwind 入口
│
├── messaging/                # 消息系统
│   ├── index.ts              # Protocol 定义
│   └── messages/             # 消息处理器
│       ├── video/
│       │   ├── get-data.ts
│       │   └── cache-data.ts
│       └── user/
│           └── cache-item-list.ts
│
├── e2e/                      # E2E 测试
│   ├── playwright.config.ts
│   ├── pages/                # 测试用例
│   │   ├── recommend.spec.ts
│   │   ├── user.spec.ts
│   │   └── explore.spec.ts
│   └── utils/                # 测试工具
│       ├── extension-fixture.ts
│       └── extension-helper.ts
│
├── .wxt/                     # WXT 生成文件
│   └── wxt.d.ts              # 类型声明
│
├── wxt.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. 核心功能开发

### 4.1 后台脚本 (entrypoints/background.ts)

```typescript
import { onMessage } from "@/messaging";

export default defineBackground(() => {
  console.log('[Extension] Background script loaded');

  // 注册消息处理器
  onMessage("example/hello", ({ data }) => {
    return `Hello, ${data}!`;
  });
});
```

### 4.2 主内容脚本 (entrypoints/main.content.tsx)

这是 SPA 应用的路由入口，监听 URL 变化并初始化对应处理器：

```typescript
import "~/assets/tailwind.css";
import { detectPageType, type PageType } from "@/src/content/types";
import { cleanup } from "@/src/content/cleanup";
import { initRecommendPage } from "@/src/content/recommend";
import { initUserPage } from "@/src/content/user";

export default defineContentScript({
  matches: ["*://www.example.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("[Extension] Main content script loaded");

    // 防止重复初始化
    if (window.__extensionInitialized) {
      return;
    }
    window.__extensionInitialized = true;

    // 检测当前页面类型
    let currentPage = detectPageType(window.location.pathname);

    const initPage = async (pageType: PageType) => {
      // 清理上一页
      cleanup();

      // 初始化新页面
      switch (pageType) {
        case "recommend":
          await initRecommendPage(ctx);
          break;
        case "user":
          await initUserPage(ctx);
          break;
        default:
          console.log("[Extension] Unknown page type");
      }

      window.__currentPage = pageType;
    };

    // 初始页面初始化
    await initPage(currentPage);

    // 监听 URL 变化 (WXT 内置事件)
    ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
      const newPageType = detectPageType(newUrl?.pathname);

      if (newPageType !== currentPage) {
        currentPage = newPageType;
        initPage(currentPage);
      }
    });
  },
});
```

### 4.3 Fetch 拦截脚本 (entrypoints/fetch-inject.content.ts)

拦截页面 API 请求，用于获取页面数据：

```typescript
import fetchIntercept from "fetch-intercept";

export default defineContentScript({
  matches: ["*://www.example.com/*"],
  world: "MAIN",           // 在页面主线程运行
  runAt: "document_start", // 页面加载前运行

  main() {
    fetchIntercept.register({
      response(response) {
        // 拦截特定 API
        if (response.url.includes("/api/data/")) {
          response.clone().json().then((data) => {
            // 派发自定义事件，传递给内容脚本
            window.dispatchEvent(
              new CustomEvent("myapp:data", { detail: data })
            );
          });
        }
        return response;
      },
    });
  },
});
```

### 4.4 页面处理器示例 (src/content/recommend.tsx)

```typescript
import { mountOverlay } from "@/src/utils/mountOverlay";
import { RecommendPageOverlay } from "@/src/components/RecommendPageOverlay";

export async function initRecommendPage(ctx: ContentScriptContext) {
  console.log("[Extension] Initializing recommend page");

  // 监听 fetch 拦截派发的事件
  const handleData = (event: CustomEvent) => {
    const data = event.detail;
    // 处理数据...
  };

  window.addEventListener("myapp:data", handleData as EventListener);

  // 挂载 UI 覆盖层
  const ui = await mountOverlay(ctx, {
    elementName: "myapp-recommend-overlay",
    position: "inline",
    anchor: ".video-container",
    append: "first",
    onMount: (wrapper) => {
      const container = wrapper.document.body;
      const root = createRoot(container);
      root.render(<RecommendPageOverlay />);
      return root;
    },
  });

  // 保存引用用于清理
  window.__currentUI = ui;
}
```

### 4.5 消息系统 (messaging/)

#### Protocol 定义 (messaging/index.ts)

```typescript
import { defineExtensionMessaging } from '@webext-core/messaging';

// 定义消息协议：函数签名 = 参数类型 => 返回值类型
interface ProtocolMap {
  'video/get-data': (data: { videoId: string }) => VideoData | null;
  'video/cache-data': (data: { id: string; data: unknown }) => { success: boolean };
}

// 创建 messenger
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
```

#### 消息处理器 (messaging/messages/video/get-data.ts)

```typescript
import { onMessage } from "@/messaging";

export default () => {
  onMessage("video/get-data", async ({ data }) => {
    const { videoId } = data;
    // 从缓存获取数据
    const cached = await getVideoData(videoId);
    return cached;
  });
};
```

#### 发送消息

```typescript
import { sendMessage } from "@/messaging";

// 在内容脚本中发送消息到 background
const data = await sendMessage("video/get-data", { videoId: "123" });
```

### 4.6 挂载 UI 覆盖层 (src/utils/mountOverlay.tsx)

```typescript
import type { ContentScriptContext } from "wxt/client";

export async function mountOverlay(
  ctx: ContentScriptContext,
  options: {
    elementName: string;
    position: "inline" | "overlay";
    anchor: string;
    append: "first" | "last" | "before" | "after";
    onMount: (wrapper: ShadowRoot) => unknown;
  }
) {
  const ui = await createShadowRootUi(ctx, {
    name: options.elementName,
    position: options.position,
    anchor: options.anchor,
    append: options.append,
    onMount: options.onMount,
  });

  ui.mount();
  return ui;
}
```

### 4.7 全局类型声明 (src/content/types.ts)

```typescript
// 页面类型
export type PageType = "recommend" | "user" | "video" | "explore" | "unknown";

// 扩展 Window 类型
declare global {
  interface Window {
    __extensionInitialized?: boolean;
    __currentPage?: PageType;
    __currentUI?: unknown;
  }
}

// 检测页面类型
export function detectPageType(pathname: string): PageType {
  if (pathname === "/" || pathname === "/foryou") {
    return "recommend";
  }
  if (pathname.match(/^\/@[\w.-]+\/video\//)) {
    return "video";
  }
  if (pathname.match(/^\/@[\w.-]+/)) {
    return "user";
  }
  if (pathname === "/explore") {
    return "explore";
  }
  return "unknown";
}
```

---

## 5. E2E 测试配置

### 5.1 安装 Playwright

```bash
pnpm add -D @playwright/test playwright tsx
```

### 5.2 配置文件 (e2e/playwright.config.ts)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './pages',          // 测试用例目录
  fullyParallel: false,        // 扩展测试通常需要串行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                  // 单线程运行
  reporter: 'html',
  timeout: 120000,             // 2 分钟超时

  use: {
    headless: false,           // 扩展测试需要显示浏览器
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    baseURL: 'https://www.example.com',
    actionTimeout: 60000,
    navigationTimeout: 90000,
  },

  projects: [
    {
      name: 'chromium-with-extension',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
```

### 5.3 扩展 Fixture (e2e/utils/extension-fixture.ts)

这是测试扩展的关键 - 加载扩展到浏览器：

```typescript
import { test as base, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.join(__dirname, '../../.output/chrome-mv3-dev');
const USER_DATA_DIR = path.join(__dirname, '../.browser-data');

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<ExtensionFixtures>({
  // 重写 context 以加载扩展
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
      ],
      viewport: { width: 1280, height: 720 },
    });
    await use(context);
    await context.close();
  },

  // 获取扩展 ID
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
```

### 5.4 测试辅助函数 (e2e/utils/extension-helper.ts)

```typescript
import { Page } from '@playwright/test';

/**
 * 等待扩展 overlay 元素出现
 */
export async function waitForExtensionReady(
  page: Page,
  overlayName: string
): Promise<void> {
  const alreadyExists = await page.evaluate((name) => {
    const elements = document.querySelectorAll(name);
    return elements.length > 0;
  }, overlayName);

  if (alreadyExists) return;

  await page.waitForFunction(
    (name) => {
      const elements = document.querySelectorAll(name);
      return elements.length > 0;
    },
    overlayName,
    { timeout: 60000, polling: 500 }
  );
}

/**
 * 查询自定义元素是否存在
 */
export async function queryShadowDom(
  page: Page,
  elementName: string
): Promise<boolean> {
  return await page.evaluate((name) => {
    const elements = document.querySelectorAll(name);
    return elements.length > 0;
  }, elementName);
}
```

### 5.5 测试用例示例 (e2e/pages/recommend.spec.ts)

```typescript
import { test, expect } from "../utils/extension-fixture";
import { waitForExtensionReady, queryShadowDom } from "../utils/extension-helper";

test.describe("推荐页", () => {
  test("页面加载后应显示覆盖层", async ({ context }) => {
    const page = await context.newPage();

    // 访问目标页面
    await page.goto("https://www.example.com/foryou", {
      waitUntil: "domcontentloaded",
    });

    // 等待页面元素
    await page.waitForSelector(".video-container", {
      timeout: 15000,
      state: "attached",
    });

    // 等待扩展初始化
    await waitForExtensionReady(page, "myapp-recommend-overlay");

    // 验证覆盖层存在
    const hasOverlay = await queryShadowDom(page, "myapp-recommend-overlay");
    expect(hasOverlay).toBeTruthy();
  });
});
```

### 5.6 运行测试

```bash
# 1. 先构建扩展 (开发模式)
pnpm build:dev

# 2. 运行所有测试
pnpm test:e2e

# 3. 运行特定测试
pnpm test:e2e e2e/pages/recommend.spec.ts

# 4. UI 模式调试
pnpm test:e2e:ui

# 5. 查看测试报告
pnpm test:e2e:report
```

### 5.7 .gitignore 配置

```gitignore
# 测试浏览器数据
e2e/.browser-data/
e2e/test-results/
playwright-report/
```

---

## 6. 常用命令

### 开发

```bash
pnpm dev              # 开发模式 (Chromium)
pnpm dev:firefox      # 开发模式 (Firefox)
```

### 构建

```bash
pnpm build            # 正式构建 (Chromium)
pnpm build:dev        # 测试构建 (Chromium)
pnpm build:firefox    # Firefox 构建
```

### 打包

```bash
pnpm zip              # 打包扩展 (.crx)
pnpm zip:firefox      # Firefox 打包 (.xpi)
```

### 测试

```bash
pnpm compile          # TypeScript 类型检查
pnpm test:e2e         # 运行 E2E 测试
pnpm test:e2e:ui      # UI 模式测试
```

---

## 附录：关键文件模板

### Tailwind CSS 入口 (src/assets/tailwind.css)

```css
@import "tailwindcss";
```

### Popup 入口 (entrypoints/popup/index.html)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Extension</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### Popup 主文件 (entrypoints/popup/main.tsx)

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 参考资源

- [WXT 官方文档](https://wxt.dev/)
- [WXT 入口点](https://wxt.dev/entrypoints/)
- [WXT 内容脚本](https://wxt.dev/entrypoints/content-scripts.html)
- [WXT 消息通信](https://wxt.dev/guide/essentials/messaging)
- [@webext-core/messaging](https://webext-core.aklinker1.io/messaging/)
- [Playwright 浏览器扩展测试](https://playwright.dev/docs/chrome-extensions)
- [Tailwind CSS v4](https://tailwindcss.com/)
