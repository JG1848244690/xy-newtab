# Extension APIs

WXT 提供了一组工具函数来帮助简化浏览器 API 的使用。

---

## 核心工具函数

WXT 提供了以下工具函数：

| 函数 | 来源 | 描述 |
|------|------|------|
| `browser` | `wxt/browser` | 浏览器 API 的别名（支持跨浏览器） |
| `fakeBrowser` | `wxt/testing` | 用于测试的模拟浏览器实例 |
| `defineBackground` | `wxt/sandbox` | 定义后台脚本 |
| `defineContentScript` | `wxt/sandbox` | 定义内容脚本 |
| `defineUnlistedScript` | `wxt/sandbox` | 定义未列出的脚本 |

---

## browser 导入

### 基本使用

`browser` 是浏览器 API 的跨浏览器别名。它会自动根据目标浏览器返回正确的 API 对象：

```typescript
import { browser } from 'wxt/browser';

// 使用浏览器 API
browser.tabs.query({ active: true })
  .then((tabs) => {
    console.log('Active tab:', tabs[0]);
  });

browser.storage.local.set({ key: 'value' });
browser.runtime.sendMessage({ type: 'PING' });
```

### 跨浏览器兼容性

`browser` 导入会根据构建目标自动选择：

- **Chrome/Edge/Opera**：返回 `chrome` API
- **Firefox/Safari**：返回 `browser` API

```typescript
// 你不需要写这样的代码：
const api = browser === 'chrome' ? chrome : browser;

// WXT 自动处理：
import { browser } from 'wxt/browser';
browser.tabs.query(...); // 在所有浏览器中工作
```

### 为什么使用 browser 而不是 chrome？

虽然 Chrome 使用 `chrome` 命名空间，但 WXT 的 `browser` 别名提供了以下优势：

1. **统一代码**：使用相同的代码支持所有浏览器
2. **WebExtension 标准**：`browser` 是 WebExtension 标准的 API 名称
3. **自动适配**：WXT 自动处理 `chrome` 和 `browser` 之间的差异

---

## defineBackground

定义后台脚本或 Service Worker。

### 基本语法

```typescript
import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('Background script started');

  // 后台脚本逻辑
  browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
});
```

### 使用异步初始化

```typescript
export default defineBackground(async () => {
  // 执行异步初始化
  const data = await fetchInitialData();
  const db = await initializeDatabase();

  // 设置监听器
  browser.runtime.onMessage.addListener((message) => {
    handleMessage(message, db);
  });
});
```

### 访问浏览器 API

```typescript
export default defineBackground(() => {
  // 所有浏览器 API 都可用
  browser.alarms.create('ping', { periodInMinutes: 1 });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'ping') {
      console.log('Ping!');
    }
  });

  browser.contextMenus.create({
    id: 'open-tool',
    title: 'Open Tool',
    contexts: ['selection'],
  });
});
```

---

## defineContentScript

定义内容脚本，注入到网页中运行。

### 基本语法

```typescript
import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['*://*.example.com/*'],

  main() {
    console.log('Content script loaded');
    document.body.style.border = '5px solid red';
  },
});
```

### 选项配置

```typescript
export default defineContentScript({
  // 匹配模式
  matches: ['https://*.google.com/*'],

  // 排除模式
  exclude_matches: ['*://*.google.com/amp/*'],

  // CSS 文件
  css: ['content-style.css'],

  // 运行时机
  run_at: 'document_idle',

  // ALL_FRAMES 选项
  all_frames: false,

  // 声明全局变量
  globals: {
    $: {
      type: 'function',
      description: 'jQuery',
    },
  },

  main() {
    // 使用声明的全局变量
    $('body').css('border', '5px solid red');
  },
});
```

### 使用世界隔离（MV3）

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],

  // 指定脚本世界
  world: 'ISOLATED', // 或 'MAIN'

  main() {
    // ISOLATED: 在隔离的世界中运行（默认）
    // MAIN: 在网页的主世界中运行，可以访问页面变量
  },
});
```

### 多个内容脚本

```typescript
// example-1.content.ts
export default defineContentScript({
  matches: ['*://*.example.com/*'],
  main() {
    console.log('Script 1');
  },
});

// example-2.content.ts
export default defineContentScript({
  matches: ['*://*.example.com/*'],
  main() {
    console.log('Script 2');
  },
});
```

---

## defineUnlistedScript

定义未列出的脚本，不在 manifest 中声明。

### 使用场景

适用于：
- 动态注入的脚本
- 不需要声明匹配模式的脚本
- 从其他脚本调用的工具脚本

### 基本语法

```typescript
import { defineUnlistedScript } from 'wxt/sandbox';

export default defineUnlistedScript(() => {
  console.log('Unlisted script executed');

  // 这个脚本不会自动注入到任何页面
  // 需要手动调用或通过编程方式注入
});
```

### 从后台脚本调用

```typescript
// unlisted-script.ts
export default defineUnlistedScript(() => {
  console.log('Unlisted script loaded');
  window.postMessage({ type: 'UNLISTED_SCRIPT_LOADED' }, '*');
});

// background.ts
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      // 动态注入未列出的脚本
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/unlisted-script.js'],
      });
    }
  });
});
```

---

## fakeBrowser

用于测试的模拟浏览器实例。

### 基本使用

```typescript
import { fakeBrowser } from 'wxt/testing';
import { describe, it, expect, vi } from 'vitest';

describe('Extension Logic', () => {
  it('should store data', async () => {
    // Mock storage API
    fakeBrowser.storage.local.set.mockResolvedValue();
    fakeBrowser.storage.local.get.mockResolvedValue({ key: 'value' });

    // 测试你的代码
    const result = await fakeBrowser.storage.local.get('key');
    expect(result).toEqual({ key: 'value' });
  });
});
```

### Mock 事件监听器

```typescript
it('should listen for messages', async () => {
  const listener = vi.fn();

  // 添加监听器
  browser.runtime.onMessage.addListener(listener);

  // 触发事件
  fakeBrowser.runtime.onMessage.call({ type: 'TEST' });

  // 验证
  expect(listener).toHaveBeenCalled();
});
```

---

## API 差异处理

**重要**：WXT 的目标是提供统一的开发体验，而不是统一所有浏览器的 API 差异。浏览器之间的 API 差异仍然存在，开发者需要处理这些差异。

### 检测浏览器类型

```typescript
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  // 检查当前浏览器
  if (browser.runtime.getBrowserInfo) {
    // Firefox/Safari 特定 API
    browser.runtime.getBrowserInfo().then((info) => {
      console.log('Browser:', info.name);
    });
  }

  // 使用环境变量检测浏览器
  if (import.meta.env.FIREFOX) {
    console.log('Running on Firefox');
  } else if (import.meta.env.CHROME) {
    console.log('Running on Chrome');
  }
});
```

### 处理 API 差异

```typescript
export default defineBackground(() => {
  // 某些 API 在不同浏览器中有不同的签名
  const createTab = async (url: string) => {
    if (import.meta.env.FIREFOX) {
      // Firefox API
      return await browser.tabs.create({ url });
    } else {
      // Chrome API
      return await new Promise((resolve) => {
        chrome.tabs.create({ url }, (tab) => resolve(tab));
      });
    }
  };
});
```

---

## 完整示例

### Background 脚本

```typescript
// entrypoints/background.ts
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  // 安装时初始化
  browser.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed');

    // 设置默认值
    await browser.storage.local.set({
      enabled: true,
      count: 0,
    });
  });

  // 处理消息
  browser.runtime.onMessage.addListener((message, sender) => {
    console.log('Received message:', message);

    if (message.type === 'GET_COUNT') {
      return browser.storage.local.get('count')
        .then((result) => ({ count: result.count || 0 }));
    }

    if (message.type === 'INCREMENT') {
      return browser.storage.local.get('count')
        .then((result) => {
          const count = (result.count || 0) + 1;
          return browser.storage.local.set({ count })
            .then(() => ({ count }));
        });
    }
  });

  // 创建上下文菜单
  browser.contextMenus.create({
    id: 'increment-counter',
    title: 'Increment Counter',
    contexts: ['all'],
  });

  browser.contextMenus.onClicked.addListener(() => {
    browser.runtime.sendMessage({ type: 'INCREMENT' });
  });
});
```

### Content Script

```typescript
// entrypoints/example.content.ts
import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['*://*.example.com/*'],

  // 声明页面上的全局变量
  globals: {
    React: {
      type: 'object',
      description: 'React library',
    },
    $: {
      type: 'function',
      description: 'jQuery',
    },
  },

  main() {
    // 向 background 发送消息
    const sendMessage = async () => {
      const response = await browser.runtime.sendMessage({
        type: 'GET_COUNT',
      });
      console.log('Count:', response.count);
    };

    // 监听来自 background 的消息
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'UPDATE') {
        console.log('Received update:', message.data);
      }
    });

    // 使用页面上的库
    const app = React.createElement('div', null, 'Hello!');
    $('body').append(app);

    // 初始消息
    sendMessage();
  },
});
```

### Unlisted Script

```typescript
// entrypoints/utils/unlisted-tool.ts
import { defineUnlistedScript } from 'wxt/sandbox';

export default defineUnlistedScript(() => {
  console.log('Unlisted tool loaded');

  // 这个脚本不会自动运行
  // 需要从其他脚本调用
  window.dispatchEvent(new CustomEvent('unlisted-tool-ready'));
});
```

---

## 相关资源

- [WXT Extension APIs 官方文档](https://wxt.dev/guide/essentials/extension-apis.html)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Mozilla WebExtension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)
