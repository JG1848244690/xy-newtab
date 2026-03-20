# 挂载点查找详细指南

本文档提供挂载点查找的详细技术说明和最佳实践。

## DOM 分析技巧

### 使用 Playwright 获取页面信息

```typescript
// 获取页面快照（可访问性树）
await page.snapshot();

// 获取元素的 outerHTML
const html = await page.locator('.target').evaluate(el => el.outerHTML);

// 获取元素的属性
const attrs = await page.locator('.target').evaluate(el => ({
  id: el.id,
  className: el.className,
  dataset: el.dataset,
  attributes: Array.from(el.attributes).map(a => [a.name, a.value])
}));

// 获取元素的父元素链
const parents = await page.locator('.target').evaluate(el => {
  const result = [];
  let current = el;
  while (current && current !== document.body) {
    result.push({
      tag: current.tagName,
      id: current.id,
      className: current.className,
      dataset: current.dataset
    });
    current = current.parentElement;
  }
  return result;
});
```

### 使用浏览器 DevTools

```javascript
// 在 DevTools Console 中运行
// 获取元素的完整信息
const element = document.querySelector('.target');

// 查看元素的所有属性
console.log(element);
console.log('ID:', element.id);
console.log('Classes:', element.className);
console.log('Dataset:', element.dataset);
console.log('Attributes:', Array.from(element.attributes).map(a => `${a.name}="${a.value}"`));

// 查看父元素链
let parents = [];
let current = element;
while (current && current !== document.body) {
  parents.push(`${current.tagName}${current.id ? '#' + current.id : ''}${current.className ? '.' + current.className.split(' ').join('.') : ''}`);
  current = current.parentElement;
}
console.log('Parents:', parents.join(' > '));
```

## 选择器生成策略

### 策略 1: data-e2e 优先

```typescript
// ✅ 最佳 - 使用 data-e2e
const selector = '[data-e2e="video-player"]';

// TikTok 常见的 data-e2e 值：
// - video-player, video-card, user-post-list
// - browse-video-desc, browse-username, like-btn
// - share-btn, comment-btn, more-btn
```

### 策略 2: 语义化 ID

```typescript
// ✅ 好 - 使用语义化 ID
const selector = '#main-container';
const selector = '#video-player-wrapper';

// ❌ 避免 - 随机生成的 ID
const selector = '#app_12345';
const selector = '#_nc_123';  // Notion 等框架的随机 ID
```

### 策略 3: ARIA 属性

```typescript
// ✅ 可用 - 使用 ARIA 属性
const selector = '[role="main"]';
const selector = '[aria-label="视频播放器"]';
const selector = '[aria-labelledby="video-title"]';
```

### 策略 4: 组合选择器

```typescript
// ✅ 更稳定 - 标签 + class + 属性组合
const selector = 'main[data-type="video-page"]';
const selector = 'section.xgplayer-container[data-e2e="player"]';

// ❌ 不稳定 - 仅使用不稳定的 class
const selector = 'div._abc123';  // 数字后缀可能变化
const selector = 'div.css-xyz';  // CSS-in-JS 生成的 class
```

### 策略 5: 使用 closest 查找稳定父元素

```typescript
// 从不稳定元素找到稳定的父元素
const anchor = document.querySelector('[data-e2e="browse-username"]')?.closest('.video-card');
const anchor = document.querySelector('.play-button')?.closest('.xgplayer-container');
```

## 常见页面类型挂载点

### TikTok 视频播放器

```typescript
// 推荐页视频
anchor: document.querySelector('[data-e2e="browse-username"]')?.closest('.video-card');
append: 'after';

// 详情页视频
anchor: document.querySelector('.xgplayer-container');
append: 'after';

// 用户主页视频列表
anchor: document.querySelector('[data-e2e="user-post-list"]');
append: 'first';

// 探索页视频
anchor: document.querySelector('[data-e2e="explore-video-list"]');
append: 'first';
```

### 社交媒体平台

```typescript
// Twitter 推文
anchor: document.querySelector('[data-testid="tweet"]');
append: 'before';

// Facebook 帖子
anchor: document.querySelector('[role="feed"]');
append: 'first';

// Instagram 帖子
anchor: document.querySelector('article');
append: 'after';

// YouTube 视频
anchor: document.querySelector('#player-container');
append: 'after';
```

### 电商网站

```typescript
// 商品详情
anchor: document.querySelector('[data-product-container]')
  || document.querySelector('.product-detail');
append: 'after';

// 商品列表
anchor: document.querySelector('.product-list');
append: 'first';

// 购物车
anchor: document.querySelector('.cart-items');
append: 'first';
```

### 内容网站

```typescript
// 文章正文
anchor: document.querySelector('article')
  || document.querySelector('[role="main"] article')
  || document.querySelector('.post-content');
append: 'before';

// 评论区
anchor: document.querySelector('.comments-section');
append: 'before';

// 侧边栏
anchor: document.querySelector('aside');
append: 'first';
```

## 调试技巧

### 在浏览器中测试选择器

```javascript
// 在 DevTools Console 中运行
const element = document.querySelector('[data-e2e="video-player"]');

// 检查元素是否存在
console.log(element ? '找到元素' : '未找到');

// 高亮元素
if (element) {
  element.style.border = '3px solid red';
  element.style.boxShadow = '0 0 10px red';
}

// 取消高亮
if (element) {
  element.style.border = '';
  element.style.boxShadow = '';
}
```

### 检查元素稳定性

```javascript
// 检查元素在滚动后是否仍然存在
window.scrollTo(0, document.body.scrollHeight);
setTimeout(() => {
  const stillExists = document.querySelector('[data-e2e="video-player"]');
  console.log(stillExists ? '稳定' : '被移除');
}, 1000);

// 检查元素在路由变化后是否仍然存在
window.addEventListener('popstate', () => {
  setTimeout(() => {
    const stillExists = document.querySelector('[data-e2e="video-player"]');
    console.log(stillExists ? '路由切换后稳定' : '路由切换后被移除');
  }, 500);
});

// 监听元素变化
let count = 0;
const element = document.querySelector('[data-e2e="video-player"]');
if (element) {
  const observer = new MutationObserver(() => {
    count++;
    console.log(`元素变化次数: ${count}`);
  });
  observer.observe(element, { attributes: true, childList: true, subtree: true });
}
```

### 创建临时挂载点验证

```javascript
// 快速验证挂载点是否正确
const anchor = document.querySelector('[data-e2e="video-player"]');
if (anchor) {
  const container = document.createElement('div');
  container.style.cssText = 'background: red; padding: 20px; color: white; z-index: 999999; position: relative;';
  container.textContent = '✓ 挂载点验证';

  if (anchor.parentElement) {
    anchor.parentElement.insertBefore(container, anchor.nextSibling);
    console.log('验证元素已插入');
  }
}
```

## 常见问题

### Q: 元素存在但 querySelector 找不到？

**可能原因：**
- 元素在 iframe 中，需要切换到 iframe context
- 元素是 Shadow DOM 中的元素，需要通过 shadowRoot 访问
- 选择器拼写错误

**解决方案：**
```javascript
// 检查 iframe
const iframe = document.querySelector('iframe');
if (iframe) {
  const element = iframe.contentDocument.querySelector('.target');
}

// 检查 Shadow DOM
const host = document.querySelector('custom-element');
if (host && host.shadowRoot) {
  const element = host.shadowRoot.querySelector('.target');
}
```

### Q: 元素会被动态移除怎么办？

**使用 MutationObserver 监听并重新挂载：**
```javascript
const targetSelector = '[data-e2e="video-player"]';

function mountUI() {
  const anchor = document.querySelector(targetSelector);
  if (anchor && !anchor.querySelector('.my-extension-ui')) {
    // 挂载 UI
  }
}

const observer = new MutationObserver(() => {
  mountUI();
});

observer.observe(document.body, { childList: true, subtree: true });
```

### Q: SPA 路由切换后元素消失？

**监听路由变化：**
```javascript
// WXT 提供的 wxt:locationchange 事件
ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
  // 重新挂载 UI
});

// 或使用 History API
window.addEventListener('popstate', () => {
  // 重新挂载 UI
});
```

## 最佳实践总结

1. **优先使用 data 属性** - `data-e2e`、`data-testid` 等
2. **优先语义化属性** - ID、ARIA、语义化标签
3. **避免使用随机 class** - CSS-in-JS 生成的 class
4. **使用 closest 查找稳定父元素** - 从不稳定元素向上找
5. **在浏览器中测试选择器** - 验证选择器正确性
6. **检查元素稳定性** - 滚动、路由切换后是否仍存在
7. **使用临时验证** - 用红色高亮验证挂载点位置
