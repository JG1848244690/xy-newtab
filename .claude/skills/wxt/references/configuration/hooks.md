# Hooks 配置

Hooks 允许你在 WXT 构建过程的特定阶段执行代码，无需 fork 整个框架。

Hooks 可以用于：
- 修改构建输出
- 根据输入生成额外文件
- 在启动时验证环境
- 添加自定义构建步骤
- 集成第三方工具

---

## 可用的 Hooks

### `build:done`

构建完成后触发。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:done': async () => {
      console.log('Build completed!');
    },
  },
});
```

### `build:generated`

在 WXT 生成所有入口点后、Vite 开始打包代码前触发。可以用于访问生成的入口点列表并执行额外操作。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:generated': async (wxt) => {
      // wxt.entries 包含所有生成的入口点
      console.log('Generated entries:', wxt.entries);
    },
  },
});
```

### `build:manifestGenerated`

在 manifest 对象完全构建后、写入磁盘前触发。返回修改后的 manifest 对象。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      // 修改 manifest
      manifest.name = 'Modified Name';
      manifest.permissions.push('additionalPermission');
      return manifest;
    },
  },
});
```

### `build:mounted`

在 WXT CLI 完成初始化后、开始运行命令前触发。可以用于验证环境、显示欢迎信息等。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:mounted': async (wxt) => {
      console.log('WXT initialized!');
      console.log('Command:', wxt.command);
      console.log('Mode:', wxt.mode);
    },
  },
});
```

### `build:publicAssets`

在处理 public 目录的资产后触发。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:publicAssets': async (wxt, publicAssets) => {
      console.log('Public assets:', publicAssets);
      // 可以修改或添加公共资产
    },
  },
});
```

### `entrypoints:resolved`

在所有入口点解析完成后触发。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'entrypoints:resolved': async (wxt, entrypoints) => {
      console.log('Resolved entrypoints:', entrypoints);
    },
  },
});
```

### `entrypoints:grouped`

在入口点按类型分组后触发。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'entrypoints:grouped': async (wxt, groups) => {
      console.log('Grouped entrypoints:', groups);
    },
  },
});
```

### `prepare:types`

在生成类型定义时触发。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'prepare:types': async (wxt) => {
      console.log('Generating types...');
    },
  },
});
```

### `ready`

当 WXT 实例准备好后触发（在任何命令执行之前）。

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'ready': async (wxt) => {
      console.log('WXT is ready!');
    },
  },
});
```

---

## Hooks 参数类型

### Wxt 对象

所有 hooks 都会接收一个 `wxt` 对象，包含以下属性：

```typescript
interface Wxt {
  // 配置信息
  config: WxtConfig;
  mode: 'development' | 'production';
  command: string;
  browser: TargetBrowser;
  manifestVersion: 2 | 3;

  // 路径信息
  userConfig: UserConfig;
  root: string;
  srcDir: string;
  publicDir: string;
  outDir: string;
  wxtDir: string;

  // 构建信息
  entries: Entry[];
  logger: Logger;
}
```

---

## 常见使用场景

### 1. 修改 Manifest

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      // 根据浏览器添加不同权限
      if (wxt.browser === 'firefox') {
        manifest.permissions.push('browserSettings');
      }

      // 根据模式修改名称
      if (wxt.mode === 'development') {
        manifest.name = `${manifest.name} (Dev)`;
      }

      return manifest;
    },
  },
});
```

### 2. 生成额外文件

```typescript
// wxt.config.ts
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  hooks: {
    'build:done': async (wxt) => {
      // 在构建完成后生成版本信息文件
      const versionInfo = {
        version: '1.0.0',
        buildTime: new Date().toISOString(),
        mode: wxt.mode,
        browser: wxt.browser,
      };

      const outputDir = join(wxt.outDir, wxt.browser);
      await mkdir(outputDir, { recursive: true });
      await writeFile(
        join(outputDir, 'version.json'),
        JSON.stringify(versionInfo, null, 2)
      );
    },
  },
});
```

### 3. 验证环境

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:mounted': async (wxt) => {
      // 检查必需的环境变量
      const requiredEnvVars = ['WXT_API_KEY', 'WXT_API_SECRET'];

      for (const envVar of requiredEnvVars) {
        if (!import.meta.env[envVar]) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }

      console.log('Environment validation passed!');
    },
  },
});
```

### 4. 自定义构建步骤

```typescript
// wxt.config.ts
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export default defineConfig({
  hooks: {
    'build:done': async () => {
      // 构建完成后运行额外的命令
      console.log('Running post-build steps...');

      // 例如：压缩图片
      await execAsync('npm run compress:images');

      // 例如：运行测试
      await execAsync('npm run test');

      console.log('Post-build steps completed!');
    },
  },
});
```

### 5. 生成文档

```typescript
// wxt.config.ts
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  hooks: {
    'build:done': async (wxt) => {
      // 生成入口点清单
      const manifest = wxt.entries.map(entry => ({
        name: entry.name,
        type: entry.type,
        inputPath: entry.inputPath,
        outputPath: entry.outputPath,
      }));

      await writeFile(
        join(wxt.outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
    },
  },
});
```

### 6. 复制额外文件

```typescript
// wxt.config.ts
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  hooks: {
    'build:done': async (wxt) => {
      // 复制 README 到输出目录
      const readmeSource = join(wxt.root, 'README.md');
      const readmeDest = join(wxt.outDir, wxt.browser, 'README.md');

      await mkdir(join(wxt.outDir, wxt.browser), { recursive: true });
      await copyFile(readmeSource, readmeDest);
    },
  },
});
```

### 7. 根据入口点生成配置

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:generated': async (wxt) => {
      // 根据入口点生成路由配置
      const routes = wxt.entries
        .filter(entry => entry.type === 'popup' || entry.type === 'options')
        .map(entry => ({
          path: entry.name,
          name: entry.name,
        }));

      console.log('Generated routes:', routes);
    },
  },
});
```

---

## 异步 Hooks

所有 hooks 都支持异步操作。可以使用 `async/await`：

```typescript
export default defineConfig({
  hooks: {
    'build:done': async (wxt) => {
      // 执行异步操作
      await someAsyncOperation();
      await anotherAsyncOperation();

      console.log('All async operations completed!');
    },
  },
});
```

---

## 条件 Hooks

可以根据条件执行 hooks：

```typescript
export default defineConfig({
  hooks: {
    'build:done': async (wxt) => {
      // 只在生产模式下执行
      if (wxt.mode === 'production') {
        console.log('Running production-specific tasks...');
        await productionTasks();
      }

      // 只针对特定浏览器
      if (wxt.browser === 'chrome') {
        console.log('Running Chrome-specific tasks...');
        await chromeTasks();
      }
    },
  },
});
```

---

## 错误处理

在 hooks 中抛出错误会中断构建过程：

```typescript
export default defineConfig({
  hooks: {
    'build:mounted': async (wxt) => {
      // 验证失败会停止构建
      if (!someCondition) {
        throw new Error('Build validation failed!');
      }
    },
  },
});
```

使用 try-catch 处理错误而不中断构建：

```typescript
export default defineConfig({
  hooks: {
    'build:done': async (wxt) => {
      try {
        await someOperation();
      } catch (error) {
        console.error('Operation failed, but continuing build:', error);
      }
    },
  },
});
```

---

## 完整配置示例

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  hooks: {
    // 初始化时验证环境
    'build:mounted': async (wxt) => {
      console.log('🚀 Initializing WXT...');
      console.log(`   Command: ${wxt.command}`);
      console.log(`   Mode: ${wxt.mode}`);
      console.log(`   Browser: ${wxt.browser}`);
      console.log(`   Manifest Version: MV${wxt.manifestVersion}`);
    },

    // 入口点解析后
    'entrypoints:resolved': async (wxt, entrypoints) => {
      console.log(`📦 Found ${entrypoints.length} entrypoints`);
    },

    // 修改 manifest
    'build:manifestGenerated': (wxt, manifest) => {
      // 开发模式添加标识
      if (wxt.mode === 'development') {
        manifest.name = `${manifest.name} (Dev)`;
        manifest.description = `${manifest.description} - Development Build`;
      }

      // 添加版本信息
      manifest.version = process.env.npm_package_version || '1.0.0';

      return manifest;
    },

    // 构建完成后
    'build:done': async (wxt) => {
      console.log('✅ Build completed successfully!');

      // 生成构建信息文件
      const buildInfo = {
        version: process.env.npm_package_version || '1.0.0',
        buildTime: new Date().toISOString(),
        mode: wxt.mode,
        browser: wxt.browser,
        manifestVersion: wxt.manifestVersion,
      };

      const outputDir = join(wxt.outDir, wxt.browser);
      await mkdir(outputDir, { recursive: true });
      await writeFile(
        join(outputDir, 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
      );

      console.log('📄 Build info written to', outputDir);
    },
  },
});
```

---

## Hooks 执行顺序

Hooks 按以下顺序执行：

1. `ready` - WXT 实例准备就绪
2. `build:mounted` - CLI 初始化完成
3. `entrypoints:resolved` - 入口点解析完成
4. `entrypoints:grouped` - 入口点分组完成
5. `build:publicAssets` - 公共资产处理完成
6. `build:generated` - 构建生成完成
7. `build:manifestGenerated` - Manifest 生成完成
8. `prepare:types` - 类型生成准备
9. `build:done` - 构建完成

---

## 相关资源

- [WXT Hooks 官方文档](https://wxt.dev/guide/essentials/config/hooks.html)
- [WXT API Reference](https://wxt.dev/api/reference.html)
