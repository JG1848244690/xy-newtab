---
name: e2e-testing
description: 编写 Electron 应用的 E2E 测试指南 - 如何使用 Playwright 测试 Electron 桌面应用
---

# E2E 测试编写指南 (Electron)

## 项目结构

```
e2e/
├── app.spec.js              # 应用启动测试
├── basic.spec.js            # 基本 UI 功能测试
├── chat.spec.js             # 聊天功能测试
├── helpers.js               # 测试辅助函数和 Page Object
└── complete.spec.js         # 完整流程测试
```

## 核心概念

### 1. Electron 应用启动

使用 Playwright 的 `_electron` API 启动应用：

```javascript
import { _electron as electron } from 'playwright';

const electronApp = await electron.launch({
  executablePath: require('electron'),
  args: ['.'],
  timeout: 30000,
});

const window = await electronApp.firstWindow({ timeout: 10000 });
```

### 2. 测试辅助函数

使用 `e2e/helpers.js` 中提供的辅助函数：

```javascript
import { launchApp, closeApp, ChatPage } from './helpers.js';

// 启动应用
const { electronApp, window } = await launchApp();

// 使用 Page Object
const chatPage = new ChatPage(window);
await chatPage.sendMessage('你好');

// 关闭应用
await closeApp(electronApp);
```

### 3. Page Object Model

使用 `ChatPage` 类封装页面操作：

```javascript
const chatPage = new ChatPage(window);

// 发送消息
await chatPage.sendMessage('测试消息');

// 切换主题
await chatPage.toggleTheme();

// 切换模型
await chatPage.switchModel('deepseek-ai/DeepSeek-V3');

// 获取消息数量
const count = await chatPage.getMessageCount();
```

## 编写测试步骤

### Step 1: 导入依赖

```javascript
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, ChatPage, selectors } from './helpers.js';
```

### Step 2: 创建测试套件

```javascript
test.describe('聊天功能', () => {
  let electronApp;
  let window;
  let chatPage;

  test.beforeEach(async () => {
    ({ electronApp, window } = await launchApp());
    chatPage = new ChatPage(window);
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });
});
```

### Step 3: 编写测试用例

```javascript
test('应该能发送消息', async () => {
  await chatPage.sendMessage('你好，世界');

  // 验证消息出现
  const messageCount = await chatPage.getMessageCount();
  expect(messageCount).toBeGreaterThan(0);
});

test('应该能切换暗色模式', async () => {
  await chatPage.toggleTheme();

  const isDark = await chatPage.isDarkMode();
  expect(isDark).toBe(true);
});
```

## 辅助函数参考

### launchApp(options)

启动 Electron 应用。

```javascript
const { electronApp, window } = await launchApp({
  timeout: 10000,      // 启动超时时间
  waitForLoad: true,   // 是否等待界面加载完成
  clearStorage: false, // 是否清理 localStorage
});
```

### closeApp(electronApp)

关闭 Electron 应用。

```javascript
await closeApp(electronApp);
```

### setApiKey(window, apiKey)

设置 API Key（用于测试需要认证的功能）。

```javascript
await setApiKey(window, 'sk-test-key');
```

### hasApiKey(window)

检查是否已设置 API Key。

```javascript
const hasKey = await hasApiKey(window);
```

### 常用选择器 (selectors)

```javascript
// 使用预定义选择器
selectors.chatInput      // 聊天输入框
selectors.sendButton     // 发送按钮
selectors.deleteButton   // 清空按钮
selectors.modelSelector  // 模型选择器
selectors.themeButton    // 主题切换按钮
selectors.messageList    // 消息列表
```

## 测试场景示例

### 场景 1: 应用启动测试

```javascript
test('应用应该成功启动', async () => {
  const { electronApp, window } = await launchApp();

  // 验证窗口标题
  expect(await window.title()).toBe('序言');

  // 验证窗口可见
  expect(await window.evaluate(() => document.visibilityState)).toBe('visible');

  await closeApp(electronApp);
});
```

### 场景 2: 聊天消息测试

```javascript
test('应该能发送和显示消息', async () => {
  const { electronApp, window } = await launchApp();
  const chatPage = new ChatPage(window);

  await chatPage.sendMessage('测试消息');

  // 验证消息出现在列表中
  const messages = window.locator('.ant-bubble, [class*="message"]');
  await expect(messages.first()).toContainText('测试消息');

  await closeApp(electronApp);
});
```

### 场景 3: 主题切换测试

```javascript
test('应该能切换暗色模式', async () => {
  const { electronApp, window } = await launchApp();
  const chatPage = new ChatPage(window);

  // 切换到暗色
  await chatPage.toggleTheme();
  expect(await chatPage.isDarkMode()).toBe(true);

  // 切换回亮色
  await chatPage.toggleTheme();
  expect(await chatPage.isDarkMode()).toBe(false);

  await closeApp(electronApp);
});
```

### 场景 4: 模型切换测试

```javascript
test('应该能切换 AI 模型', async () => {
  const { electronApp, window } = await launchApp();
  const chatPage = new ChatPage(window);

  await chatPage.switchModel('Qwen/Qwen2.5-72B-Instruct');

  // 验证选择器显示新模型
  const selector = window.locator(selectors.modelSelector);
  await expect(selector).toContainText('Qwen2.5');

  await closeApp(electronApp);
});
```

### 场景 5: 清空消息测试

```javascript
test('应该能清空所有消息', async () => {
  const { electronApp, window } = await launchApp();
  const chatPage = new ChatPage(window);

  // 先发送几条消息
  await chatPage.sendMessage('消息 1');
  await chatPage.sendMessage('消息 2');

  const countBefore = await chatPage.getMessageCount();
  expect(countBefore).toBeGreaterThan(0);

  // 清空消息
  await chatPage.clearMessages();

  await window.waitForTimeout(500); // 等待动画

  const countAfter = await chatPage.getMessageCount();
  expect(countAfter).toBe(0);

  await closeApp(electronApp);
});
```

## 最佳实践

### 1. 使用 beforeEach 和 afterEach

```javascript
test.beforeEach(async () => {
  ({ electronApp, window } = await launchApp());
});

test.afterEach(async () => {
  await closeApp(electronApp);
});
```

### 2. 使用 Page Object 封装操作

```javascript
// ✅ 推荐 - 使用 Page Object
await chatPage.sendMessage('你好');

// ❌ 不推荐 - 直接操作 DOM
await window.fill('textarea', '你好');
await window.click('button');
```

### 3. 合理使用等待

```javascript
// ✅ 推荐 - 使用 expect 自动等待
await expect(window.locator('.message')).toBeVisible();

// ❌ 避免 - 固定延时（除非必要）
await window.waitForTimeout(5000);
```

### 4. 选择器优先级

```javascript
// 1️⃣ 最稳定 - data-testid
await window.click('[data-testid="send-button"]');

// 2️⃣ 较稳定 - 文本内容
await window.click('button:has-text("发送")');

// 3️⃣ 不稳定 - CSS 类名（可能变化）
await window.click('.ant-btn-primary');
```

### 5. 测试独立性

每个测试应该能独立运行，不依赖其他测试：

```javascript
// ✅ 推荐 - 每个测试独立启动/关闭
test('测试 A', async () => {
  const { electronApp, window } = await launchApp();
  // ... 测试逻辑
  await closeApp(electronApp);
});

test('测试 B', async () => {
  const { electronApp, window } = await launchApp();
  // ... 测试逻辑
  await closeApp(electronApp);
});
```

## 调试技巧

### 1. 使用 UI 模式

```bash
pnpm test:e2e:ui
```

提供可视化界面，可以逐步执行测试。

### 2. 使用 headed 模式

```javascript
const electronApp = await electron.launch({
  headless: false, // 显示应用窗口
});
```

### 3. 截图调试

```javascript
await window.screenshot({ path: 'debug.png' });
```

### 4. 在代码中暂停

```javascript
await page.pause();
```

## 运行测试

```bash
# 运行所有测试
pnpm test:e2e

# 运行特定测试文件
pnpm test:e2e e2e/chat.spec.js

# UI 模式调试
pnpm test:e2e:ui

# 查看测试报告
pnpm test:e2e:report
```

## 注意事项

1. **启动时间** - Electron 应用启动需要 10-30 秒
2. **串行执行** - 不能并行运行测试
3. **API Key** - 某些测试需要有效的 API Key
4. **内存管理** - 确保 afterEach 关闭应用
5. **选择器变化** - UI 变化时及时更新选择器

## 常见问题

### Q: 测试超时怎么办？

增加超时时间：

```javascript
test('慢速测试', async () => {
  test.setTimeout(60000); // 60 秒
  // ...
});
```

### Q: 元素找不到怎么办？

1. 检查选择器是否正确
2. 增加等待时间
3. 使用 UI 模式查看实际 DOM 结构

### Q: 应用关闭失败怎么办？

确保在 try-finally 中关闭：

```javascript
try {
  // 测试逻辑
} finally {
  await closeApp(electronApp);
}
```
