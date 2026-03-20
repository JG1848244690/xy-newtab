---
name: find-mount-point
description: 找到浏览器扩展内容脚本的稳定挂载点 - 通过截图标注和 Playwright DOM 分析，快速定位合适的 createShadowRootUi 挂载位置。当用户提到"挂载点"、"mount point"、"在哪里渲染"、"内容脚本挂载到哪个元素"、"添加覆盖层"时使用此 skill。
---

# 内容脚本挂载点查找器

## 用途

当你要为浏览器扩展添加内容脚本，但不确定应该挂载到 DOM 的哪个位置时，使用这个 skill。

**适用场景：**
- 开发新功能时，需要为新页面添加覆盖层
- 调试现有问题时，需要分析并找到更稳定的挂载点

## 工作流程

1. 你提供目标页面 URL 和截图（圈出想要挂载的位置）
2. AI 使用 Playwright 访问页面，获取 DOM 结构
3. 分析并推荐最稳定的挂载点
4. 生成最简单的验证代码
5. 自动测试确认挂载点正确

## 输入格式

请提供以下信息：

```text
目标 URL: https://example.com/page
操作步骤:
  1. 登录账号（如果需要）
  2. 点击导航栏"我的"按钮
  3. 等待内容加载
目标位置: [截图 - 请圈出想要挂载的区域]
```

**操作步骤说明：**
- 如果页面直接访问即可显示内容，可省略操作步骤
- 描述要具体：点击什么、输入什么、等待什么
- 如果需要登录，请说明登录方式

## 输出格式

AI 会返回：

1. **挂载点分析** - 简要说明选中的 DOM 元素
2. **验证代码** - 最简单的 `createShadowRootUi` 配置
3. **测试结果** - Playwright 自动验证的截图

示例输出：

```text
推荐挂载点: [data-e2e="video-player-container"]
- 稳定性: 高（使用 data-e2e 属性）
- 位置: 视频播放器容器之后
- 注意: 此元素在页面加载后始终存在
```

## 挂载点选择优先级

AI 按以下优先级选择挂载点：

| 优先级 | 选择器类型 | 示例 | 稳定性 |
|--------|-----------|------|--------|
| 1 | `data-e2e` 属性 | `[data-e2e="user-post-list"]` | ⭐⭐⭐ 最稳定 |
| 2 | 语义化 ID | `#video-player-container` | ⭐⭐⭐ 稳定 |
| 3 | ARIA 属性 | `[role="main"]` | ⭐⭐ 较稳定 |
| 4 | 语义化 class | `main.content` | ⭐ 一般 |
| 5 | 结构化路径 | `div > div:nth-child(2)` | ⚠️ 不推荐 |

**避免选择：**
- 随机生成的 class（如 `_abc123`）
- 动态广告/推荐区域
- 可能被 SPA 路由移除的容器

## 验证代码模板

AI 生成的代码包含：

```tsx
// entrypoints/temp-mount-point.content.tsx
import { defineContentScript } from 'wxt/sandbox';
import { createShadowRootUi } from 'wxt/client';

export default defineContentScript({
  matches: ['<目标页面URL模式>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'temp-mount-point',
      position: 'inline',
      anchor: document.querySelector('<推荐的选择器>'),
      append: 'after',
      onMount: (container) => {
        container.style.position = 'relative';
        const div = document.createElement('div');
        div.style.cssText = 'background: red; padding: 20px; color: white; z-index: 999999; font-weight: bold;';
        div.textContent = '✓ 挂载点验证';
        container.appendChild(div);
      },
      onRemove: (container) => {
        container.remove();
      },
    });
    ui.mount();
  },
});
```

**使用方法：**
1. 将代码复制到 `entrypoints/temp-mount-point.content.tsx`
2. 运行 `pnpm dev` 加载扩展
3. 访问目标页面，查看红色提示框是否出现在正确位置
4. 确认无误后，删除临时文件，开始正式开发

## AI 执行流程

当 skill 被触发时：

1. **解析输入** - 提取 URL、操作步骤、截图标注
2. **打开页面** - 使用 Playwright `browser_navigate` 访问目标 URL
3. **执行操作** - 根据步骤使用 `browser_click`、`browser_type`、`browser_wait_for`
4. **获取快照** - 使用 `browser_snapshot` 获取页面可访问性快照
5. **分析 DOM** - 结合截图定位目标区域
6. **评估稳定性** - 按优先级选择最稳定的挂载点
7. **生成代码** - 输出验证代码
8. **自动测试** - 使用 Playwright 验证挂载点

## 相关文档

- [挂载点查找详细指南](references/find-mount-point.md) - DOM 分析技巧、选择器策略、调试方法
