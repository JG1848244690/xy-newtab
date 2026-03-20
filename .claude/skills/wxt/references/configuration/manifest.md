# Manifest 配置

在 WXT 中，源代码中没有 `manifest.json` 文件。WXT 从多个来源生成 manifest：
- `wxt.config.ts` 中定义的全局选项
- 入口点中定义的特定选项
- WXT 模块可以修改 manifest
- 项目中定义的 hooks 可以修改 manifest

运行 `wxt build` 时，扩展的 `manifest.json` 将输出到 `.output/{target}/manifest.json`。

---

## 全局选项

在 `wxt.config.ts` 中使用 `manifest` 配置添加属性：

```typescript
export default defineConfig({
  manifest: {
    // 在这里添加手动更改
  },
});
```

也可以将 manifest 定义为函数，根据目标浏览器、模式等动态生成：

```typescript
export default defineConfig({
  manifest: ({ browser, manifestVersion, mode, command }) => {
    return {
      // ...
    };
  },
});
```

**参数说明**：
- `browser`: 目标浏览器（`chrome`、`firefox`、`safari` 等）
- `manifestVersion`: Manifest 版本（`2` 或 `3`）
- `mode`: 构建模式（`development` 或 `production`）
- `command`: 运行的命令（`dev`、`build` 等）

---

## MV2 和 MV3 兼容性

添加 manifest 属性时，应尽可能使用 MV3 格式。当 targeting MV2 时，WXT 会自动将这些属性转换为 MV2 格式。

### 示例：Action 配置

```typescript
export default defineConfig({
  manifest: {
    action: {
      default_title: 'Some Title',
    },
    web_accessible_resources: [
      {
        matches: ['*://*.google.com/*'],
        resources: ['icon/*.png'],
      },
    ],
  },
});
```

WXT 会生成以下 manifest：

**MV2 输出**：
```json
{
  "manifest_version": 2,
  "browser_action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": ["icon/*.png"]
}
```

**MV3 输出**：
```json
{
  "manifest_version": 3,
  "action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": [
    {
      "matches": ["*://*.google.com/*"],
      "resources": ["icon/*.png"]
    }
  ]
}
```

也可以指定特定于单个 manifest 版本的属性，它们将在 targeting 其他版本时被剥离。

---

## Name（名称）

如果未通过 `manifest` 配置提供，manifest 的 `name` 属性默认为 `package.json` 中的 `name` 属性。

```typescript
export default defineConfig({
  manifest: {
    name: 'My Extension',
  },
});
```

---

## Version 和 Version Name

扩展的 `version` 和 `version_name` 基于 `package.json` 中的 `version`：

- `version_name` 是精确的版本字符串
- `version` 是清理后的字符串，移除了任何无效的后缀

**示例**：

```json
// package.json
{
  "version": "1.3.0-alpha2"
}
```

```json
// .output/<target>/manifest.json
{
  "version": "1.3.0",
  "version_name": "1.3.0-alpha2"
}
```

如果 `package.json` 中没有版本，默认为 `"0.0.0"`。

---

## Icons（图标）

WXT 会自动通过查看 `public/` 目录中的文件来发现扩展的图标：

```
public/
├─ icon-16.png
├─ icon-24.png
├─ icon-48.png
├─ icon-96.png
└─ icon-128.png
```

### 自动发现的图标格式

图标必须匹配以下正则表达式之一：

| 模式 | 示例 |
|------|------|
| `icon-([0-9]+)\.png$` | `icon-16.png` |
| `icon-([0-9]+)x[0-9]+\.png$` | `icon-16x16.png` |
| `icon@([0-9]+)w\.png$` | `icon@16w.png` |
| `icon@([0-9]+)h\.png$` | `icon@16h.png` |
| `icon@([0-9]+)\.png$` | `icon@16.png` |
| `icons?/([0-9]+)\.png$` | `icon/16.png` 或 `icons/16.png` |
| `icons?/([0-9]+)x[0-9]+\.png$` | `icon/16x16.png` 或 `icons/16x16.png` |

### 手动指定图标

如果不喜欢这些文件名，或者正在迁移到 WXT 并不想重命名文件，可以手动指定 `icon`：

```typescript
export default defineConfig({
  manifest: {
    icons: {
      16: '/extension-icon-16.png',
      24: '/extension-icon-24.png',
      48: '/extension-icon-48.png',
      96: '/extension-icon-96.png',
      128: '/extension-icon-128.png',
    },
  },
});
```

### 自动生成图标

可以使用 `@wxt-dev/auto-icons` 让 WXT 生成所需尺寸的图标。

---

## Permissions（权限）

大多数情况下，需要手动将权限添加到 manifest。只有在以下特定情况下才会自动添加权限：

- **开发期间**：会添加 `tabs` 和 `scripting` 权限以启用热重载
- **存在 `sidepanel` 入口点时**：添加 `sidepanel` 权限

```typescript
export default defineConfig({
  manifest: {
    permissions: ['storage', 'tabs', 'activeTab'],
  },
});
```

**常用权限**：
- `storage` - 存储 API
- `tabs` - 标签页访问
- `activeTab` - 当前活动标签页
- `scripting` - 动态脚本注入
- `alarms` - 定时器
- `notifications` - 通知
- `webRequest` - 网络请求拦截

---

## Host Permissions（主机权限）

```typescript
export default defineConfig({
  manifest: {
    host_permissions: ['https://www.google.com/*'],
  },
});
```

**⚠️ 警告**：如果使用主机权限并同时 targeting MV2 和 MV3，确保只包含每个版本所需的主机权限：

```typescript
export default defineConfig({
  manifest: ({ manifestVersion }) => ({
    host_permissions: manifestVersion === 2
      ? ['<all_urls>']
      : ['https://*/*', 'http://localhost/*'],
  }),
});
```

---

## Default Locale（默认语言环境）

```typescript
export default defineConfig({
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
  },
});
```

> 有关扩展国际化的完整指南，请参阅 I18n 文档。

---

## Actions（操作）

在 MV2 中，有两个选项：`browser_action` 和 `page_action`。在 MV3 中，它们合并为单一的 `action` API。

默认情况下，每当生成 `action` 时，WXT 在 targeting MV2 时会回退到 `browser_action`。

### 带弹出窗口的 Action

要生成点击图标后显示 UI 的 manifest，只需创建一个 Popup 入口点。

如果要在 MV2 中使用 `page_action`，请在 HTML 文档的 head 中添加以下 meta 标签：

```html
<meta name="manifest.type" content="page_action" />
```

### 不带弹出窗口的 Action

如果要使用 `activeTab` 权限或 `browser.action.onClicked` 事件，但不想显示弹出窗口：

1. 删除 Popup 入口点（如果存在）
2. 将 `action` 键添加到 manifest：

```typescript
export default defineConfig({
  manifest: {
    action: {},
  },
});
```

与带有弹出窗口的 action 一样，WXT 会为 MV2 回退到使用 `browser_action`。

要改用 `page_action`，也添加该键：

```typescript
export default defineConfig({
  manifest: {
    action: {},
    page_action: {},
  },
});
```

---

## 完整配置示例

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: ({ browser, manifestVersion, mode }) => {
    const isDev = mode === 'development';

    return {
      // 基本信息
      name: isDev ? 'My Extension (Dev)' : 'My Extension',
      description: 'A great extension',

      // 版本信息
      version: '1.0.0',

      // 图标
      icons: {
        16: '/icon-16.png',
        48: '/icon-48.png',
        128: '/icon-128.png',
      },

      // 权限
      permissions: ['storage', 'activeTab'],

      // 主机权限
      host_permissions: ['https://api.example.com/*'],

      // Action
      action: {
        default_title: 'Click me',
      },

      // MV3 特定配置
      ...(manifestVersion === 3 && {
        host_permissions: ['https://*/*'],
      }),

      // MV2 特定配置
      ...(manifestVersion === 2 && {
        browser_action: {
          default_title: 'Click me',
        },
      }),
    };
  },
});
```

---

## 相关资源

- [WXT Manifest 官方文档](https://wxt.dev/guide/essentials/config/manifest.html)
- [Chrome Manifest 文档](https://developer.chrome.com/docs/extensions/mv3/manifest)
- [Mozilla Manifest 文档](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)
