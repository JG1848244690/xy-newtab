---
name: e2e-test
description: 自动检测代码变更并运行相关 E2E 测试，验证 Electron 应用功能是否正常
---

# E2E Test Skill (Electron)

自动检测代码变更，运行相关 E2E 测试并返回结果。

## 触发时机

在 `superpowers:requesting-code-review` skill 中被自动调用，或手动触发。

## 变更检测映射

| 文件路径 | 触发的测试文件 | 说明 |
|---------|--------------|------|
| `src/renderer/src/components/**/*.jsx` | `e2e/basic.spec.js` | UI 组件变更 |
| `src/renderer/src/hooks/useChatManager.js` | `e2e/chat.spec.js` | 聊天逻辑变更 |
| `src/renderer/src/hooks/useTheme.js` | `e2e/basic.spec.js` | 主题功能变更 |
| `src/main/index.js` | `e2e/app.spec.js` | 主进程变更 |
| `src/preload/**/*.js` | `e2e/app.spec.js` | Preload 变更 |
| `src/renderer/src/config/**/*.js` | 所有测试 | 配置文件变更 |
| `playwright.config.js` | 所有测试 | 测试配置变更 |
| `e2e/helpers.js` | 所有测试 | 测试辅助函数变更 |

## 执行流程

### Step 1: 检测变更文件

```bash
git diff --name-only HEAD~1 HEAD
# 或查看未暂存的变更
git diff --name-only
```

### Step 2: 确定要运行的测试

根据映射表，确定需要运行哪些测试文件。

### Step 3: 运行测试

```bash
# 运行所有测试
pnpm test:e2e

# 运行特定测试文件
pnpm test:e2e e2e/app.spec.js
pnpm test:e2e e2e/chat.spec.js
pnpm test:e2e e2e/basic.spec.js

# 使用 UI 模式运行（推荐调试时使用）
pnpm test:e2e:ui
```

### Step 4: 解析结果

读取 Playwright 输出，汇总：
- 通过的测试数量
- 失败的测试数量
- 失败用例的详情

## 使用方式

手动触发：
```
运行 E2E 测试
```

自动触发：
- 在 code review skill 中自动调用

## 注意事项

1. **Electron 应用启动慢** - 每个测试需要 10-30 秒启动时间
2. **需要设置 API Key** - 某些测试需要有效的 API Key
3. **使用串行模式** - Electron 应用不支持并行测试
4. **测试超时配置** - 默认 30 秒，可在 playwright.config.js 中调整
