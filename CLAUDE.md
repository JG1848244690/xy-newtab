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

- `entrypoints/`：`background.ts`（消息路由 + 云同步 + 书签导入）、`popup/`（快捷添加 + 本地快捷方式筛选）、`newtab/`（主界面）
- `src/store/`：自研订阅式 store（`src/lib/store.ts`），持久化走 `createStorageCell`（`src/lib/storage.ts`）
- `src/hooks/`：store 的薄壳 hook，组件只从这里取数据
- `src/services/`：纯函数业务逻辑（无副作用）
- `src/components/`：UI，文案一律走 `useI18n()` 的 `t()`，不要硬编码中文
- `src/schemas/`：storage / 云端 / 导入数据的运行时校验
- `messaging/index.ts`：跨 context 消息协议（`@webext-core/messaging`），新增消息必须同时登记类型
- 主题：CSS 变量 + `theme-init.js`（防闪烁），不要引入新的主题方案

## 云同步（可选功能）

- 后端是独立仓库 `tasks-api` 的 `xy-newtab` 分支，生产地址 `https://kskbl.com.cn/api`
- 手动模型：`pullAndMerge`（newtab 挂载，30min 节流）/ `uploadLocal` / `downloadCloud`
- 脏标记 `src/utils/syncDirty.ts` → UI 红点；同步成功清脏
- **只同步 shortcuts + groups**，不含标签页会话
- 未登录时所有本地功能必须照常可用

## 权限约定（商店审核敏感）

`wxt.config.ts` 里的 manifest 权限保持最小化：`storage` / `activeTab` / `bookmarks` / `identity`。
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
