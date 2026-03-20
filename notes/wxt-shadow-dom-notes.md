# WXT Shadow DOM 学习笔记

## 概述

WXT 框架提供了 `createShadowRootUi` API，用于在内容脚本（Content Scripts）中创建隔离的 UI。Shadow DOM 可以让你的扩展 UI 与页面样式完全隔离，避免冲突。

## 核心 API: createShadowRootUi

### 使用步骤

1. **导入 CSS 文件** - 在内容脚本顶部导入样式
2. **设置 cssInjectionMode** - 设置为 `"ui"`
3. **定义 UI** - 使用 `createShadowRootUi()` 定义 UI
4. **挂载 UI** - 调用 `ui.mount()` 使 UI 可见

### API 参数

```typescript
const ui = await createShadowRootUi(ctx, {
  name: 'example-ui',        // UI 的唯一名称
  position: 'inline',         // 位置: 'inline' 或 'overlay'
  anchor: 'body',             // 锚点元素选择器
  onMount: (container) => {   // 挂载时的回调
    // 返回需要在 onRemove 中清理的资源
  },
  onRemove: (resource) => {   // 移除时的回调
    // 清理资源
  },
});
```

## 框架集成示例

### React 示例

```typescript
import './style.css';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
```

### Vue 示例

```typescript
import './style.css';
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
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

### Svelte 示例

```typescript
import './style.css';
import App from './App.svelte';
import { mount, unmount } from 'svelte';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        return mount(App, { target: container });
      },
      onRemove: (app) => {
        unmount(app);
      },
    });

    ui.mount();
  },
});
```

### Solid.js 示例

```typescript
import './style.css';
import { render } from 'solid-js/web';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const unmount = render(() => <div>...</div>, container);
        return unmount;
      },
      onRemove: (unmount) => {
        unmount?.();
      },
    });

    ui.mount();
  },
});
```

## 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | UI 的唯一标识符 |
| `position` | `'inline' \| 'overlay'` | UI 的定位方式 |
| `anchor` | `string` | CSS 选择器，指定 UI 插入的位置 |
| `onMount` | `(container: ShadowRoot) => T` | 挂载回调，接收 Shadow DOM 容器 |
| `onRemove` | `(resource: T) => void` | 移除回调，用于清理资源 |

## UI 类型对比

WXT 提供三种构建 UI 的方法：

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| **集成 (Integrated)** | UI 与页面内容一起渲染 | 简单交互，不需要样式隔离 |
| **Shadow Root** | 使用 Shadow DOM 隔离样式 | 需要样式隔离，避免页面 CSS 干扰 |
| **IFrame** | 在 IFrame 中渲染 UI | 完全隔离，但通信复杂 |

## 生命周期管理

```typescript
// 挂载 UI
ui.mount();

// 移除 UI
ui.remove();

// 检查 UI 是否已挂载
if (ui.mounted) {
  // UI 已挂载
}
```

## 注意事项

1. **必须设置 cssInjectionMode**: 使用 `createShadowRootUi` 时必须设置 `cssInjectionMode: 'ui'`
2. **资源清理**: 确保在 `onRemove` 中正确清理框架实例
3. **样式隔离**: Shadow DOM 内的样式不会影响页面，页面的样式也不会影响 Shadow DOM
4. **事件处理**: Shadow DOM 内的事件需要注意事件冒泡行为

## 参考文档

- [WXT Content Scripts 官方文档](https://wxt.dev/guide/essentials/content-scripts)
- [BaseContentScriptEntrypointOptions API](https://wxt.dev/api/reference/wxt/interfaces/BaseContentScriptEntrypointOptions)