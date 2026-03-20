---
name: data-source-finder
description: 确定页面数据的来源 - 通过 Playwright 自动追踪或 DevTools 手动搜索，判断数据是来自 API 接口还是页面 DOM，并选择合适的提取方案。当用户提到"数据来源"、"数据从哪来"、"如何获取数据"、"抓取数据"、"提取数据"时使用此 skill。
---

# 数据来源查找器

## 用途

当你需要从目标页面获取特定数据，但不确定数据来源时，使用这个 skill。

**适用场景：**
- 开发新功能时，需要获取页面上的数据
- 分析数据是来自 API 接口还是页面 DOM
- 选择最合适的数据提取方案

## 核心理念

**数据来源决定提取方式：**
- 数据来自 **API 接口** → 使用 fetch/XHR 拦截
- 数据来自 **页面 DOM** → 使用 DOM 操作提取

## 工作流程

### Step 1: 定位目标数据

在目标页面上找到你想要获取的数据，比如一个数字 `1551`、一段文字、一个列表等。

### Step 2: 使用 DevTools 搜索

1. 打开浏览器 DevTools (`F12`)
2. 打开 **搜索面板** (Ctrl+Shift+F / Cmd+Option+F)
3. 搜索目标数据（如 `1551`）
4. 查看搜索结果，分析数据可能的来源

### Step 3: 分析来源

根据搜索结果判断数据来源：

**情况 A: 数据在 Response 中**
```
搜索结果显示在 Network 面板的 Response 中
→ 数据来自 API 接口
→ 使用 fetch 拦截方案
```

**情况 B: 数据只在 DOM 中**
```
搜索结果只显示在 Elements 面板的 HTML 中
→ 数据已渲染在页面上
→ 使用 DOM 提取方案
```

**情况 C: 两者都有**
```
数据既在 Response 中，也在 DOM 中
→ 优先选择 fetch 拦截（数据更原始、更稳定）
→ 如果 API 不可拦截，退而使用 DOM 提取
```

### Step 4: 选择提取方案

| 来源 | 方案 | 优点 | 缺点 |
|------|------|------|------|
| API 接口 | fetch 拦截 | 数据原始、结构化、稳定 | 需要找到正确的 API |
| 页面 DOM | DOM 操作 | 直接可用、无需等待 | 结构可能变化、需要解析 |

## Playwright 自动化流程

AI 可以使用 Playwright MCP 工具自动追踪数据来源，无需手动操作 DevTools。

### 自动化步骤

1. **访问页面** - 使用 `browser_navigate` 访问目标 URL
2. **执行操作** - 根据需要使用 `browser_click`、`browser_type` 导航到目标位置
3. **监听网络** - 使用 `browser_network_requests` 获取所有 API 请求
4. **搜索 DOM** - 使用 `browser_snapshot` 获取页面快照，分析数据位置
5. **生成报告** - 汇总 API 和 DOM 中的匹配结果

### Playwright 追踪代码

当需要更精细的控制时，AI 可以使用 `browser_run_code` 执行自定义追踪脚本：

```javascript
async (page) => {
  const targetData = '1551'; // 要搜索的目标数据
  const results = {
    api: [],
    dom: []
  };

  // 1. 监听所有响应
  page.on('response', async (response) => {
    try {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      // 只检查 JSON 响应
      if (contentType.includes('json')) {
        const text = await response.text();
        if (text.includes(targetData)) {
          results.api.push({
            url: url,
            method: response.request().method(),
            preview: text.slice(0, 500)
          });
        }
      }
    } catch (e) {
      // 忽略解析错误
    }
  });

  // 2. 等待页面加载
  await page.waitForLoadState('networkidle');

  // 3. 在 DOM 中搜索
  const domElements = await page.locator(`text=/${targetData}/`).all();
  for (const el of domElements) {
    const tagName = await el.evaluate(node => node.tagName);
    const className = await el.evaluate(node => node.className);
    results.dom.push({
      tag: tagName,
      class: className,
      found: true
    });
  }

  // 4. 返回分析结果
  return {
    target: targetData,
    source: results.api.length > 0 ? 'API' : (results.dom.length > 0 ? 'DOM' : 'NOT_FOUND'),
    apiMatches: results.api.length,
    domMatches: results.dom.length,
    details: results
  };
}
```

### AI 执行流程

当 skill 被触发时，AI 应该：

1. **解析输入** - 提取目标 URL、操作步骤、目标数据
2. **打开页面** - 使用 `browser_navigate` 访问
3. **执行操作** - 根据步骤导航（登录、点击等）
4. **获取网络请求** - 使用 `browser_network_requests` 列出 API 调用
5. **获取页面快照** - 使用 `browser_snapshot` 分析 DOM 结构
6. **比对数据来源** - 判断数据在 API 还是 DOM 中
7. **生成代码** - 输出对应的提取代码

## 输入格式

请提供以下信息：

```text
目标页面 URL: https://example.com/page
目标数据描述: 比如视频播放量 1551
操作步骤:
  1. 登录账号（如果需要）
  2. 导航到目标页面
  3. 等待数据加载
截图: [可选 - 标注目标数据位置]
```

## 输出格式

AI 会返回：

```text
数据来源分析:
- 搜索关键词: "1551"
- 搜索结果:
  - Network Response: /api/video/stats (JSON)
  - DOM Elements: <span class="play-count">1551</span>

推荐方案: fetch 拦截
理由: 数据来自 API，结构稳定，可直接获取原始数据

验证代码: [对应方案的代码示例]
```

## Fetch 拦截方案

当数据来自 API 时，使用 fetch 拦截：

```typescript
// entrypoints/fetch-inject.content.ts
// world: MAIN, runAt: document_start

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  const url = args[0] as string;
  if (url.includes('/api/video/stats')) {
    const clone = response.clone();
    const data = await clone.json();

    // 派发自定义事件
    window.dispatchEvent(new CustomEvent('my-app:data-ready', {
      detail: data
    }));
  }

  return response;
};
```

**监听拦截的数据：**

```typescript
// 在内容脚本中监听
window.addEventListener('my-app:data-ready', (event) => {
  const data = event.detail;
  console.log('获取到数据:', data);
});
```

## DOM 提取方案

当数据只在 DOM 中时，使用选择器提取：

```typescript
// 提取单个数据
const playCount = document.querySelector('.play-count')?.textContent;

// 提取列表数据
const items = Array.from(document.querySelectorAll('.video-item')).map(el => ({
  title: el.querySelector('.title')?.textContent,
  count: el.querySelector('.play-count')?.textContent,
}));

// 监听动态内容
const observer = new MutationObserver(() => {
  const newData = document.querySelector('.play-count')?.textContent;
  if (newData) {
    console.log('数据更新:', newData);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

## 决策流程图

```
用户提供目标数据
        │
        ▼
  AI 自动化？ ─────────────────────────────────┐
        │                                      │
   ┌────┴────┐                                 │
   │         │                                 ▼
  是        否                          手动 DevTools
   │         │                                 │
   ▼         │                          搜索目标数据
Playwright   │                                 │
自动化       │                                 ▼
   │         │                           在 Response 中？
   ▼         │                              │
访问页面     │                           ┌──┴──┐
   │         │                           │     │
监听网络     │                          是     否
   │         │                           │     │
搜索 DOM     │                           ▼     ▼
   │         │                        fetch   在 DOM 中？
   ▼         │                        拦截       │
分析结果     │                              ┌──┴──┐
   │         │                              │     │
   ▼         │                             是     否
判断来源 ◄───┘                              │     │
        │                                   ▼     ▼
        ▼                                 DOM   继续搜索
     生成代码                             提取
```

**说明：**
- **自动化路径**：AI 使用 Playwright MCP 工具自动访问、监听、分析
- **手动路径**：用户自己操作 DevTools，AI 提供指导

## 常见数据来源

### TikTok 数据示例

| 数据类型 | 来源 | 提取方案 |
|----------|------|----------|
| 视频列表 | `/api/post/item_list/` | fetch 拦截 |
| 用户信息 | `/api/user/detail/` | fetch 拦截 |
| 播放量 | DOM + API | 优先 fetch |
| 评论数 | DOM + API | 优先 fetch |
| 用户名 | DOM | DOM 提取 |

### 电商网站示例

| 数据类型 | 来源 | 提取方案 |
|----------|------|----------|
| 商品列表 | API (异步加载) | fetch 拦截 |
| 商品价格 | DOM (服务端渲染) | DOM 提取 |
| 用户评价 | API (分页) | fetch 拦截 |

## 调试技巧

### 快速判断数据来源

```javascript
// 在 DevTools Console 中运行
// 监听所有 fetch 请求
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch:', args[0]);
  return originalFetch(...args);
};

// 监听所有 XHR
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new originalXHR();
  xhr.addEventListener('load', function() {
    console.log('XHR:', xhr.responseURL, xhr.responseText.slice(0, 200));
  });
  return xhr;
};
```

### 检查数据是否在 DOM 中

```javascript
// 搜索数据在 DOM 中的位置
function findInDOM(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  while (walker.nextNode()) {
    if (walker.currentNode.textContent.includes(text)) {
      console.log('Found in:', walker.currentNode.parentElement);
      walker.currentNode.parentElement.style.outline = '2px solid red';
    }
  }
}

findInDOM('1551');
```

## 相关文档

- [挂载点查找](../find-mount-point/Skill.md) - 找到稳定的 DOM 挂载点
- [WXT Content Scripts](../wxt/references/content-scripts.md) - 内容脚本开发指南
