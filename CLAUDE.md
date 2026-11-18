# CLAUDE.md

本文件给 AI 编码助手（Claude Code / Codex / OpenCode）提供本仓库的上下文。

## 项目是什么

「序言」是一个 Chrome 新标签页扩展（Manifest V3，WXT + React 19 + TS）。
单一用途：**把新标签页换成用户自己的分组书签面板**（Speed Dial）+ 壁纸。
**不要**添加网页搜索框、搜索引擎切换，或任何修改默认搜索服务商的功能 —— 这会违反 Chrome 应用商店政策（曾因此被拒）。

## 常用命令

```bash
pnpm dev            # 开发模式（Chrome）
pnpm build          # 生产构建 → .output/chrome-mv3
pnpm compile        # tsc --noEmit（提交前必须 0 错误）
pnpm test:e2e       # Playwright，会启动真实 Chrome 窗口（headless:false）
```

## 架构

- `entrypoints/`：`background.ts`（消息路由 + 书签导入 + favicon 代理）、`popup/`（快捷添加 + 本地快捷方式筛选）、`newtab/`（主界面）
- `src/store/`：自研订阅式 store（`src/lib/store.ts`），持久化走 `createStorageCell`（`src/lib/storage.ts`）
- `src/hooks/`：store 的薄壳 hook，组件只从这里取数据
- `src/services/`：书签与分组的纯函数业务逻辑，以及 Chrome 书签导入入口
- `src/components/`：UI，文案一律走 `useI18n()` 的 `t()`，不要硬编码中文
- `src/schemas/`：storage / 导入数据的运行时校验
- `messaging/index.ts`：跨 context 消息协议（`@webext-core/messaging`），新增消息必须同时登记类型
- 主题：CSS 变量 + `theme-init.js`（防闪烁），不要引入新的主题方案

## 数据边界（重要）

**这个扩展完全本地运行**：没有账号、没有云同步、没有自建后端、没有统计/遥测。
唯一的对外请求是取网站图标（Google / DuckDuckGo / icon.horse，只发域名）。

- 数据存 `chrome.storage.local`（快捷方式/分组/设置）与 IndexedDB（背景图/视频/favicon 缓存）
- 备份与迁移：JSON 导出导入、一键从 Chrome 书签导入
- Dock 固定顺序通过旧版 `sys-dock` 记录保存，兼容已安装扩展和 JSON 备份。常规分组归属不读取此记录。
- Favicon 由后台统一读取 IndexedDB 和请求图标源，书签卡片和 Dock 共用渲染组件。
- **不要**重新引入任何服务端、登录、上传下载逻辑；这会让商店审核和隐私政策复杂化

## 权限约定（商店审核敏感）

`wxt.config.ts` 里的 manifest 权限保持最小化：`storage` / `activeTab` / `bookmarks`，
host_permissions 只保留三家 favicon 源。
新增权限或 host_permissions 前先确认真的必要，并在提交说明里写清用途。

## 商店相关

- `public/_locales/{en,zh_CN}/messages.json`：manifest 的 name / description（`__MSG_*__`）
- `public/_locales/*/description.txt`：商店长描述
- `docs/privacy-policy.{md,html}`：隐私政策，后台「隐私权」标签页需填公开 URL
- **上传前必须删除 `manifest.json` 的 `key` 字段**（商店拒收），本地加载才需要它来固定扩展 ID

## 约定

- 注释与提交说明用中文，代码标识符用英文
- 不做无意义的文件拆分；改动保持在既有分层内
- 提交前跑 `pnpm compile`；涉及 UI 行为变化时手动验证（不要默认跑 e2e，成本较高）
