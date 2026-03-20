# 浏览器启动配置

在开发期间，WXT 使用 Mozilla 的 `web-ext` 自动打开一个已安装扩展的浏览器窗口。

---

## 配置文件位置

可以在 3 个地方配置浏览器启动：

### 1. 项目级配置（已忽略版本控制）

`<rootDir>/web-ext.config.ts` - 此文件会被版本控制忽略，让你可以为特定项目配置自己的选项，而不影响其他开发者。

```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // 配置选项
});
```

### 2. WXT 配置文件

`<rootDir>/wxt.config.ts` - 通过 `webExt` 配置项，包含在版本控制中。

```typescript
export default defineConfig({
  webExt: {
    // 配置选项
  },
});
```

### 3. 全局配置

`$HOME/web-ext.config.ts` - 为你计算机上的所有 WXT 项目提供默认值。

---

## 常用配置示例

### 设置浏览器二进制文件

要设置或自定义开发期间打开的浏览器：

```typescript
export default defineWebExtConfig({
  binaries: {
    chrome: '/path/to/chrome-beta',           // 使用 Chrome Beta
    firefox: 'firefoxdeveloperedition',        // 使用 Firefox Developer Edition
    edge: '/path/to/edge',                     // 运行 "wxt -b edge" 时打开 MS Edge
  },
});
```

**默认行为**：WXT 会尝试自动发现 Chrome/Firefox 的安装位置。如果浏览器安装在非标准位置，则需要手动设置。

### 持久化数据

默认情况下，为了不修改浏览器现有配置文件，`web-ext` 每次运行 `dev` 脚本时都会创建全新的配置文件。

目前，只有基于 Chromium 的浏览器支持在多次运行 `dev` 脚本时持久化数据。

#### Mac/Linux 配置

```typescript
export default defineWebExtConfig({
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
});
```

#### Windows 配置

```typescript
import { resolve } from 'node:path';

export default defineWebExtConfig({
  // 在 Windows 上，路径必须是绝对路径
  chromiumProfile: resolve('.wxt/chrome-data'),
  keepProfileChanges: true,
});
```

使用持久化配置文件的好处：
- 可以安装开发者工具扩展来辅助开发
- 浏览器会记住登录状态
- 不必担心下次运行 `dev` 脚本时配置文件被重置

**提示**：可以为 `--user-data-dir` 使用任何目录。以上示例为每个 WXT 项目创建持久化配置文件。要为所有 WXT 项目创建配置文件，可以将 `chrome-data` 目录放在用户主目录中。

### 禁用自动打开浏览器

如果更喜欢手动将扩展加载到浏览器中，可以禁用自动打开行为：

```typescript
export default defineWebExtConfig({
  disabled: true,
});
```

---

## 完整配置选项

### binaries

指定浏览器的二进制文件路径。

```typescript
binaries: {
  chrome?: string;
  chromium?: string;
  edge?: string;
  firefox?: string;
  firefoxDeveloperEdition?: string;
  // ... 其他浏览器
}
```

### chromiumArgs

传递给 Chromium 浏览器的命令行参数。

```typescript
chromiumArgs: string[]
```

### firefoxArgs

传递给 Firefox 的命令行参数。

```typescript
firefoxArgs: string[]
```

### chromiumProfile

Chromium 配置文件目录（仅限 Windows）。

```typescript
chromiumProfile: string
```

### keepProfileChanges

是否保留对配置文件的更改。

```typescript
keepProfileChanges: boolean
```

### disabled

是否禁用自动打开浏览器。

```typescript
disabled: boolean
```

---

## 完整配置示例

```typescript
import { defineWebExtConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineWebExtConfig({
  // 使用 Chrome Beta
  binaries: {
    chrome: '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
  },

  // 持久化数据（Mac/Linux）
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],

  // 或持久化数据（Windows）
  // chromiumProfile: resolve('.wxt/chrome-data'),
  // keepProfileChanges: true,

  // 其他选项
  startUrl: ['https://example.com'],  // 启动时打开的 URL
});
```

---

## 相关资源

- [WXT Browser Startup 官方文档](https://wxt.dev/guide/essentials/config/browser-startup.html)
- [web-ext API Reference](https://github.com/mozilla/web-ext)
