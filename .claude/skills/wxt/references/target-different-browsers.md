# 多浏览器支持

WXT 允许你为不同的浏览器构建扩展。

---

## 构建目标浏览器

### 基本用法

使用 `-b` 或 `--browser` 标志指定目标浏览器：

```bash
# Chrome
wxt build -b chrome
wxt build --browser chrome

# Firefox
wxt build -b firefox
wxt build --browser firefox

# Safari
wxt build -b safari
wxt build --browser safari

# Edge
wxt build -b edge
wxt build --browser edge

# Opera
wxt build -b opera
wxt build --browser opera
```

### 开发模式

同样可以在开发时指定浏览器：

```bash
# 使用 Chrome 开发
wxt dev -b chrome

# 使用 Firefox 开发
wxt dev -b firefox
```

### 默认浏览器

如果不指定浏览器，默认为 `chrome`：

```bash
wxt build     # 等同于 wxt build -b chrome
wxt dev       # 等同于 wxt dev -b chrome
```

---

## 支持的浏览器

| 浏览器 | 标识符 | Manifest 版本 |
|--------|--------|---------------|
| Chrome | `chrome` | MV3 (可配置 MV2) |
| Firefox | `firefox` | MV2 (可配置 MV3) |
| Safari | `safari` | MV2 |
| Edge | `edge` | MV3 (可配置 MV2) |
| Opera | `opera` | MV3 (可配置 MV2) |

---

## 检测当前浏览器

### 使用环境变量

在构建时，WXT 提供了布尔值环境变量来检测浏览器：

```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  if (import.meta.env.CHROME) {
    console.log('Running on Chrome');
  } else if (import.meta.env.FIREFOX) {
    console.log('Running on Firefox');
  } else if (import.meta.env.SAFARI) {
    console.log('Running on Safari');
  } else if (import.meta.env.EDGE) {
    console.log('Running on Edge');
  } else if (import.meta.env.OPERA) {
    console.log('Running on Opera');
  }
});
```

### 使用 BROWSER 变量

`import.meta.env.BROWSER` 返回字符串标识符：

```typescript
switch (import.meta.env.BROWSER) {
  case 'chrome':
    // Chrome 特定代码
    break;
  case 'firefox':
    // Firefox 特定代码
    break;
  case 'safari':
    // Safari 特定代码
    break;
}
```

---

## 浏览器特定配置

### 在 wxt.config.ts 中

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: ({ browser, manifestVersion }) => {
    const baseManifest = {
      name: 'My Extension',
      version: '1.0.0',
    };

    // 浏览器特定配置
    if (browser === 'firefox') {
      return {
        ...baseManifest,
        browser_specific_settings: {
          gecko: {
            id: 'my-extension@example.com',
          },
        },
      };
    }

    return baseManifest;
  },
});
```

### 使用函数语法

```typescript
export default defineConfig({
  manifest: ({ browser, manifestVersion, mode }) => {
    return {
      name: mode === 'development'
        ? `My Extension (${browser})`
        : 'My Extension',

      permissions: [
        'storage',
        // Firefox 特定权限
        ...(browser === 'firefox' ? ['browserSettings'] : []),
      ],

      // Chrome 特定配置
      ...(browser === 'chrome' && {
        permissions: ['sidePanel'],
      }),
    };
  },
});
```

---

## Manifest 版本控制

### 配置默认 Manifest 版本

```typescript
// wxt.config.ts
export default defineConfig({
  manifestVersion: 3, // 默认使用 MV3
});
```

### 浏览器特定 Manifest 版本

```typescript
export default defineConfig({
  manifestVersion: ({ browser }) => {
    if (browser === 'firefox') {
      return 2; // Firefox 默认使用 MV2
    }
    return 3; // 其他浏览器使用 MV3
  },
});
```

### 命令行覆盖

可以在构建时覆盖 manifest 版本：

```bash
# 使用 MV2 构建
wxt build --mv2

# 使用 MV3 构建
wxt build --mv3

# 为 Firefox 使用 MV3 构建
wxt build -b firefox --mv3
```

---

## 处理浏览器差异

### API 差异

不同浏览器的 API 可能有差异：

```typescript
// entrypoints/background.ts
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  // 某些 API 只在特定浏览器中可用
  if (import.meta.env.CHROME) {
    // Chrome 特定 API
    chrome.action.onClicked.addListener(() => {
      console.log('Chrome action clicked');
    });
  } else if (import.meta.env.FIREFOX) {
    // Firefox 特定 API
    browser.browserAction.onClicked.addListener(() => {
      console.log('Firefox action clicked');
    });
  }
});
```

### 权限差异

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: ({ browser }) => {
    const commonPermissions = ['storage', 'tabs'];

    const browserSpecificPermissions = {
      chrome: ['sidePanel'],
      firefox: ['browserSettings'],
      safari: [],
      edge: ['sidePanel'],
      opera: ['sidePanel'],
    };

    return {
      name: 'My Extension',
      permissions: [
        ...commonPermissions,
        ...browserSpecificPermissions[browser],
      ],
    };
  },
});
```

### 样式差异

```css
/* styles.css */

/* 默认样式 */
.button {
  padding: 8px 16px;
  border-radius: 4px;
}

/* Firefox 特定样式 */
@supports -moz-appearance: none {
  .button {
    border-radius: 0;
  }
}

/* Chrome 特定样式 */
@supports (-webkit-appearance: none) {
  .button {
    border-radius: 8px;
  }
}
```

---

## 为多个浏览器构建

### package.json 脚本

```json
{
  "scripts": {
    "dev": "wxt dev",
    "dev:chrome": "wxt dev -b chrome",
    "dev:firefox": "wxt dev -b firefox",
    "dev:safari": "wxt dev -b safari",
    "build": "wxt build",
    "build:chrome": "wxt build -b chrome",
    "build:firefox": "wxt build -b firefox",
    "build:safari": "wxt build -b safari",
    "build:all": "npm run build:chrome && npm run build:firefox && npm run build:safari",
    "zip": "wxt zip",
    "zip:chrome": "wxt zip -b chrome",
    "zip:firefox": "wxt zip -b firefox",
    "zip:all": "npm run zip:chrome && npm run zip:firefox"
  }
}
```

### 批量构建脚本

创建一个构建脚本来构建所有浏览器：

**scripts/build-all.js**：
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const browsers = ['chrome', 'firefox', 'safari', 'edge'];

async function buildAll() {
  for (const browser of browsers) {
    console.log(`Building for ${browser}...`);
    try {
      await execAsync(`wxt build -b ${browser}`);
      console.log(`✅ ${browser} build completed`);
    } catch (error) {
      console.error(`❌ ${browser} build failed:`, error);
    }
  }
  console.log('All builds completed!');
}

buildAll();
```

---

## 浏览器特定文件

### 文件命名约定

可以为特定浏览器创建特定文件：

```
📂 entrypoints/
   📄 background.ts           # 所有浏览器
   📄 background.chrome.ts    # 仅 Chrome
   📄 background.firefox.ts   # 仅 Firefox
```

WXT 会自动选择正确的文件：
- 构建 Chrome 时使用 `background.chrome.ts`
- 构建 Firefox 时使用 `background.firefox.ts`
- 其他浏览器使用 `background.ts`

### 特定浏览器入口点

```
📂 entrypoints/
   📄 popup.html              # 默认 popup
   📄 popup.chrome.html       # Chrome 专用 popup
   📄 popup.firefox.html      # Firefox 专用 popup
```

---

## Firefox 特定配置

### Firefox Add-on ID

Firefox 扩展需要一个唯一的 ID：

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: ({ browser }) => {
    if (browser === 'firefox') {
      return {
        browser_specific_settings: {
          gecko: {
            // 使用你的扩展 ID
            id: 'my-extension@example.com',
            strict_min_version: '109.0',
          },
        },
      };
    }
  },
});
```

### Firefox MV3 支持

Firefox 对 MV3 的支持仍在发展中。建议为 Firefox 使用 MV2：

```typescript
export default defineConfig({
  manifestVersion: ({ browser }) => {
    return browser === 'firefox' ? 2 : 3;
  },
});
```

---

## Safari 特定配置

### Safari 证书

Safari 扩展需要开发者证书：

```bash
# 构建 Safari 扩展
wxt build -b safari

# 转换为 Xcode 项目
xcodebuild -project .output/safari-mv2/MyExtension.xcodeproj
```

### Safari 权限

Safari 有不同的权限系统：

```typescript
export default defineConfig({
  manifest: ({ browser }) => {
    if (browser === 'safari') {
      return {
        permissions: ['tabs', 'storage'],
        // Safari 不支持某些权限
      };
    }
  },
});
```

---

## 环境变量

### 浏览器相关变量

| 变量 | 类型 | 描述 |
|------|------|------|
| `import.meta.env.BROWSER` | `string` | 目标浏览器（`chrome`, `firefox` 等） |
| `import.meta.env.CHROME` | `boolean` | 是否为 Chrome |
| `import.meta.env.FIREFOX` | `boolean` | 是否为 Firefox |
| `import.meta.env.SAFARI` | `boolean` | 是否为 Safari |
| `import.meta.env.EDGE` | `boolean` | 是否为 Edge |
| `import.meta.env.OPERA` | `boolean` | 是否为 Opera |
| `import.meta.env.MANIFEST_VERSION` | `2 \| 3` | 目标 Manifest 版本 |

### 使用示例

```typescript
// 根据浏览器执行不同逻辑
export default defineBackground(() => {
  const browserName = import.meta.env.BROWSER;
  const isMV3 = import.meta.env.MANIFEST_VERSION === 3;

  console.log(`Extension running on ${browserName} with MV${isMV3 ? 3 : 2}`);

  if (isMV3 && import.meta.env.CHROME) {
    // Chrome MV3 特定逻辑
    chrome.action.onClicked.addListener(handleClick);
  } else {
    // 其他情况
    browser.browserAction.onClicked.addListener(handleClick);
  }
});
```

---

## 完整配置示例

**wxt.config.ts**：
```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  // 默认 Manifest 版本
  manifestVersion: ({ browser }) => {
    return browser === 'firefox' ? 2 : 3;
  },

  // Manifest 配置
  manifest: ({ browser, manifestVersion }) => {
    const baseConfig = {
      name: 'My Extension',
      version: '1.0.0',
      permissions: ['storage', 'tabs'],
    };

    // Firefox 特定配置
    if (browser === 'firefox') {
      return {
        ...baseConfig,
        browser_specific_settings: {
          gecko: {
            id: 'my-extension@example.com',
            strict_min_version: '109.0',
          },
        },
        permissions: [...baseConfig.permissions, 'browserSettings'],
      };
    }

    // MV3 浏览器
    if (manifestVersion === 3) {
      return {
        ...baseConfig,
        host_permissions: ['<all_urls>'],
        permissions: [...baseConfig.permissions, 'sidePanel'],
      };
    }

    // MV2 浏览器
    return {
      ...baseConfig,
      permissions: [...baseConfig.permissions, '<all_urls>'],
    };
  },

  // Vite 配置
  vite: ({ mode, browser }) => ({
    define: {
      __BROWSER__: JSON.stringify(browser),
      __MODE__: JSON.stringify(mode),
    },
  }),
});
```

**entrypoints/background.ts**：
```typescript
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  console.log(`Running on ${import.meta.env.BROWSER}`);

  // 浏览器特定逻辑
  if (import.meta.env.FIREFOX) {
    // Firefox 特定 API
    browser.browserAction.onClicked.addListener(() => {
      console.log('Firefox action clicked');
    });
  } else {
    // Chrome/Edge/Opera
    browser.action.onClicked.addListener(() => {
      console.log('Action clicked');
    });
  }

  // 通用 API
  browser.storage.local.set({ initialized: true });
});
```

---

## 相关资源

- [WXT Target Different Browsers 官方文档](https://wxt.dev/guide/essentials/target-different-browsers.html)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Mozilla WebExtension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)
- [Safari Extension Development](https://developer.apple.com/documentation/safari-developer-assistant-tools)
