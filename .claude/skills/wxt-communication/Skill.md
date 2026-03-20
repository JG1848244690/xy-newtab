---
name: wxt-communication
description: WXT 浏览器扩展通信指南 - 使用 @wxt-dev/storage 和 @webext-core/messaging 进行类型安全的存储和消息传递。当用户在 WXT 项目中需要使用存储、监听存储变化、或组件间通信时使用。也用于将 chrome.storage 迁移到 @wxt-dev/storage。
---

# WXT 扩展通信指南

用于 WXT 框架项目的存储和通信。AI 已知 chrome.* APIs，本文档专注于 `@wxt-dev/storage` 和 `@webext-core/messaging`。

## 快速决策

```
需要通信/存储？
├── 获取 Content Script 的内存数据（DOM、页面变量）？
│   └── browser.tabs.sendMessage (直接与当前 Tab 通信)
├── 多组件同步状态（跨上下文共享数据）？
│   └── @wxt-dev/storage (推荐)
├── Background 执行业务逻辑（API 请求、数据处理）？
│   └── @webext-core/messaging
└── 与网页 JS (MAIN world) 通信？
    └── window.postMessage
```

---

## @wxt-dev/storage

简化的浏览器扩展存储 API，支持版本化字段、快照、元数据和项定义。

### 安装

```bash
pnpm add @wxt-dev/storage
```

### 基本用法

```typescript
import { storage } from "@wxt-dev/storage";

// 读取（带默认值）
const visible = await storage.getItem("local:overlay-visible", {
  defaultValue: true,
});

// 写入
await storage.setItem("local:overlay-visible", false);

// 监听变化（返回取消函数）
const unwatch = storage.watch("local:overlay-visible", (newValue) => {
  console.log("New value:", newValue);
});

// 取消监听
unwatch();
```

### 与 chrome.storage 对比

| 特性 | chrome.storage | @wxt-dev/storage |
|------|----------------|------------------|
| 类型推断 | 需手动断言 | `defaultValue` 自动推断 |
| 监听变化 | `onChanged` + 手动解析 | `watch()` 直接给新值 |
| 语法 | `chrome.storage.local.get(key)` | `storage.getItem(key)` |
| 默认值 | 手动处理 | `defaultValue` 选项 |

### chrome.storage 迁移到 @wxt-dev/storage

**迁移前 (browser.storage.local - 注意：WXT 使用 webextension-polyfill):**

```typescript
// 定义 key
const STORAGE_KEY = "overlay-visible";

// 读取
const result = await browser.storage.local.get(STORAGE_KEY);
const visible = result[STORAGE_KEY] ?? true; // 手动默认值

// 写入
await browser.storage.local.set({ [STORAGE_KEY]: true });

// 监听
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[STORAGE_KEY]) {
    const newValue = changes[STORAGE_KEY].newValue;
    // 使用 newValue...
  }
});
```

**迁移后 (@wxt-dev/storage):**

```typescript
import { storage } from "@wxt-dev/storage";

const STORAGE_KEY = "local:overlay-visible"; // 格式: "area:key"

// 读取（直接返回值，类型安全）
const visible = await storage.getItem(STORAGE_KEY, {
  defaultValue: true,
});

// 写入（直接传值）
await storage.setItem(STORAGE_KEY, true);

// 监听（直接拿到新值，无需解析）
const unwatch = storage.watch(STORAGE_KEY, (newValue) => {
  // 使用 newValue...
});
```

### React 组件中使用

```typescript
import { useState, useEffect } from "react";
import { storage } from "@wxt-dev/storage";

function MyComponent() {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const STORAGE_KEY = "local:overlay-visible";

    // 初始读取
    storage.getItem(STORAGE_KEY, { defaultValue: true }).then(setVisible);

    // 监听变化
    const unwatch = storage.watch(STORAGE_KEY, (newValue) => {
      setVisible(newValue ?? true);
    });

    // 清理
    return unwatch;
  }, []);

  if (visible === null) return <div>Loading...</div>;

  return <div>Overlay is {visible ? "visible" : "hidden"}</div>;
}
```

### 复杂对象存储

```typescript
// src/utils/overlayStorage.ts
import { storage } from "@wxt-dev/storage";

export interface OverlayPreferences {
  playCount: boolean;
  diggCount: boolean;
  commentCount: boolean;
  shareCount: boolean;
  collectCount: boolean;
  createDate: boolean;
  createTime: boolean;
  isAd: boolean;
}

export const DEFAULT_PREFERENCES: OverlayPreferences = {
  playCount: true,
  diggCount: true,
  commentCount: true,
  shareCount: true,
  collectCount: true,
  createDate: true,
  createTime: true,
  isAd: true,
};

const STORAGE_KEY = "local:overlay-prefs";

// 封装函数
export async function getOverlayPrefs(): Promise<OverlayPreferences> {
  return await storage.getItem(STORAGE_KEY, {
    defaultValue: DEFAULT_PREFERENCES,
  }) as OverlayPreferences;
}

export async function setOverlayPrefs(
  prefs: Partial<OverlayPreferences>,
): Promise<void> {
  const current = await getOverlayPrefs();
  const updated = { ...current, ...prefs };
  await storage.setItem(STORAGE_KEY, updated);
}

export function watchOverlayPrefs(
  callback: (prefs: OverlayPreferences) => void,
): () => void {
  return storage.watch<OverlayPreferences>(STORAGE_KEY, (newValue) => {
    if (newValue) callback(newValue);
  });
}
```

### 存储位置

`@wxt-dev/storage` 默认使用 `browser.storage.local`。存储数据可以在 DevTools → Application → Storage 中查看。

### 存储区域

支持四种存储区域，通过 key 前缀指定：

```typescript
"local:my-key"      // browser.storage.local
"session:my-key"    // browser.storage.session
"sync:my-key"       // browser.storage.sync
"managed:my-key"    // browser.storage.managed (只读)
```

---

## Popup 获取 Content Script 数据

**重要**: `@webext-core/messaging` 的处理器运行在 Background，无法访问 Content Script 的内存数据（DOM、页面变量）。

获取 Content Script 内存数据必须使用 `browser.tabs.sendMessage`。

### browser.tabs.sendMessage

**Popup 发送:**

```typescript
// entrypoints/popup/App.tsx
import { browser } from "wxt/browser";

const getCurrentPageData = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return null;

  try {
    const response = await browser.tabs.sendMessage(tab.id, {
      type: "GET_CURRENT_DATA"
    });
    return response;
  } catch (err) {
    console.error("Failed to get data:", err);
    return null;
  }
};
```

**Content Script 接收:**

```typescript
// src/content/main.content.tsx 或页面处理器

// 同步响应（数据立即可用）
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CURRENT_DATA") {
    // 访问内存数据
    sendResponse({
      videoId: window.__tiktokVideoItems?.[0]?.id,
      videoData: parseCurrentVideo()
    });
  }
});

// 异步响应（需要等待 API 或其他异步操作）
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CURRENT_DATA") {
    fetchVideoData().then(data => {
      sendResponse(data);
    });
    return true; // 必须返回 true 表示异步响应
  }
});
```

### 对比表

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| Popup 获取 Content Script DOM/内存数据 | `browser.tabs.sendMessage` | 直接与 Content Script 通信 |
| 多组件同步用户偏好设置 | `@wxt-dev/storage` | 响应式，跨上下文自动同步 |
| Background 执行 API 请求、数据处理 | `@webext-core/messaging` | 类型安全，处理器在 Background |
| 与网页自身 JS 通信 | `window.postMessage` | 跨 World 通信 |

---

## @webext-core/messaging

**注意**: 消息处理器运行在 **Background**，适用于 Background 执行的业务逻辑（API 请求、数据处理等）。

**不适用于**: 获取 Content Script 的内存数据 → 使用 `browser.tabs.sendMessage`

### 定义协议

```typescript
// messaging/index.ts
interface ProtocolMap {
  'video/get-data': (data: { videoId: string }) => VideoData | null;
  'overlay/toggle': (data: { visible: boolean }) => void;
  'storage/get': () => { overlayVisible: boolean };
}
```

### 发送消息（类型自动推断）

```typescript
import { sendMessage } from "@/messaging";

// 类型自动推断
const data = await sendMessage("video/get-data", { videoId: "123" });
//      ^? VideoData | null

await sendMessage("overlay/toggle", { visible: true });
```

### 接收消息

```typescript
// messaging/messages/video/get-data.ts
import { onMessage } from "@/messaging";

export default () => {
  onMessage("video/get-data", async ({ data }) => {
    // data 类型自动推断为 { videoId: string }
    return fetchVideo(data.videoId);
  });
};
```

### 与 chrome.runtime.sendMessage 对比

| 特性 | browser.tabs.sendMessage | browser.runtime.sendMessage | @webext-core/messaging |
|------|---------------------------|---------------------------|------------------------|
| 目标 | 指定 Tab 的 Content Script | Background | Background 处理器 |
| 类型安全 | ❌ | ❌ | ✅ 完整类型推断 |
| 访问 CS 内存数据 | ✅ | ❌ | ❌ (在 BG 执行) |
| 适用场景 | Popup → Content Script | 简单点对点 | Background 业务逻辑 |

**注意**: WXT 使用 webextension-polyfill，统一使用 `browser` 前缀而非 `chrome`。

---

## Shadow DOM 通信

WXT 的 `createShadowRootUi()` 创建 Shadow DOM，但不影响浏览器 API 和 window 事件。

### 存储监听在 Shadow DOM 中正常工作

```typescript
// Shadow DOM 组件内
import { storage } from "@wxt-dev/storage";

function ShadowComponent() {
  useEffect(() => {
    // ✅ 完全可行，@wxt-dev/storage 不受 Shadow DOM 影响
    const unwatch = storage.watch("local:overlay-prefs", (newValue) => {
      console.log("Prefs changed:", newValue);
    });
    return unwatch;
  }, []);
}
```

### 跨 Shadow DOM 通信使用 CustomEvent

```typescript
// 派发
window.dispatchEvent(new CustomEvent("tiktok:data-updated", {
  detail: { videoId: "123", stats: {...} }
}));

// 监听
window.addEventListener("tiktok:data-updated", ((e: CustomEvent) => {
  console.log(e.detail);
}) as EventListener);
```

---

## 项目示例

**本项目文件:**
- `entrypoints/popup/components/DisplaySettings.tsx` - Popup 中使用 @wxt-dev/storage
- `src/utils/displayPreferences.ts` - 显示偏好设置存储
- `src/utils/compareStorage.ts` - 存储工具函数（仍使用 browser.storage.local）
- `messaging/index.ts` - 消息协议定义
- `messaging/messages/` - 消息处理器

## 外部资源

- [@wxt-dev/storage 文档](https://github.com/wxt-dev/wxt/tree/main/packages/storage)
- [@webext-core/messaging](https://github.com/zswang/webext-core)