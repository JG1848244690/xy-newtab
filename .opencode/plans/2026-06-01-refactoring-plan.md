# 重构优化计划

日期：2026-06-01

---

## 优先级 P0 — 紧急问题

### 1. `GroupLayout.tsx`（595 行）—— 上帝组件拆分

**问题**：处理了 DnD 拖拽、搜索过滤、批量选择/迁移/删除、4 个弹窗协调、无分组快捷方式管理、导入导出等 7+ 种职责。

**方案**：
| 提取目标 | 估算行数 | 说明 |
|----------|----------|------|
| `UngroupedShortcutsSection.tsx` | ~100 | 无分组快捷区的批量选择/迁移/删除 |
| `GroupLayoutToolbar.tsx` | ~50 | 顶部工具栏（导入导出、新建组按钮） |
| `SortableGroupCard.tsx`（独立文件） | ~30 | 目前内嵌在 GroupLayout 中的 DnD 包装 |

### 2. `SearchBar.tsx`（567 行）—— 提取搜索逻辑层

**问题**：UI 渲染 + 搜索建议获取 + 键盘导航 + 历史管理全在一个文件。

**方案**：
| 提取目标 | 估算行数 | 说明 |
|----------|----------|------|
| `useSearchSuggestions.ts` | ~150 | 接管 JSONP/fetch 建议获取、debounce、清理 |
| `useSuggestionNavigation.ts` | ~80 | 键盘上下/回车/ESC 导航逻辑 |
| `SuggestionDropdown.tsx` | ~100 | 建议下拉列表的 portal 渲染 |

### 3. `BackgroundDialog.tsx`（285 行）—— 重复代码/疑似废弃

**问题**：与 `SettingsSheet.tsx`（387 行）几乎完全相同，各自的 `PRESET_COLORS`、`PRESET_IMAGES`、`SIZE_OPTIONS` 与 `constants.ts` 重复。

**方案**：
- 如果未在代码中被引用 → 删除 `BackgroundDialog.tsx`
- 如果仍被使用 → 提取 `useBackgroundSettings.ts` hook，两个组件共享

---

## 优先级 P1 — 重要重构

### 4. `ShortcutGroupCard.tsx`（439 行）拆分

**问题**：内联的 `SortableShortcutCard` + 批量选择管理 + 迁移 + 颜色主题映射 + 展开折叠。

**方案**：
| 提取目标 | 估算行数 | 说明 |
|----------|----------|------|
| `SortableShortcutCard.tsx` | ~40 | DnD 包装组件，独立文件 |
| `useBatchSelection.ts` | ~60 | 批量选择/取消/全选逻辑，可复用 |
| 颜色配置迁移到 `constants.ts` | — | `GROUP_COLOR_THEMES` 集中管理 |

### 5. 提取公共背景设置 hook

**方案**：新建 `src/hooks/useBackgroundSettings.ts`
- 封装 3 种背景类型（none/color/image）的状态管理
- 图片上传/URL 输入/预设选择逻辑
- 供 `SettingsSheet.tsx` 和 `BackgroundDialog.tsx` 共用

### 6. 统一导入路径

**问题**：混用 `@/src/utils/types`、`@/messaging`、`~/src/assets/tailwind.css`，前缀不一致。

**方案**：
- 统一使用 `@/` 前缀（不重复 `src`）
- 修正所有 import：`@/src/utils/` → `@/utils/`、`~/src/assets/` → `@/assets/` 等

### 7. `useTheme.ts` 补全或标记废弃

**方案**：
- 如果是占位代码 → 实现真正的亮暗切换（从 `storage` 读取 `theme` 设置，写入 `local:settings`）
- 如果暂时不做 → 添加 `TODO` 注释并统一返回 `'dark'`

---

## 优先级 P2 — 代码卫生

| # | 问题 | 方案 |
|---|------|------|
| 8 | `console.log` 留在生产代码 | `useGroups.ts`（~15 处）、`GroupLayout.tsx`、`ShortcutGroupCard.tsx` 中的 debug log 全部清理 |
| 9 | `GroupDialog.tsx` 和 `ShortcutGroupCard.tsx` 颜色硬编码重复 | 统一提取到 `constants.ts` 的 `GROUP_COLOR_MAP` |
| 10 | `_gitignore` 废弃模板文件 | 删除根目录 `_gitignore` |
| 11 | `BackgroundDialog.tsx` 和 `ShortcutGrid.tsx` 疑似废弃 | 先确认是否在用，未引用则删除 |
| 12 | Storage key 前缀分散在各 hook | 在 `constants.ts` 中添加 `STORAGE_PREFIX = 'local:'`，hook 中统一使用 |

---

## 执行阶段建议

```
阶段 1（安全重构）:  6 → 8 → 9 → 10        导入路径 + 清理 console/hardcode/废弃文件
阶段 2（逻辑提取）:  1 → 2 → 4              拆分大文件，不改变行为
阶段 3（重复消除）:  3 → 5                 合并重复背景逻辑
阶段 4（功能补全）:  7                     补全主题切换
```
