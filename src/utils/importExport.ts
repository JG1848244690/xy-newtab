/**
 * 导入导出工具函数
 */

import type { BookmarkLayouts, Shortcut, ShortcutGroup, ExportData, Settings } from './types';
import { DOCK_GROUP_ID } from './constants';
import { getDockIds, setDockIds } from '@/src/services/groups';
import { groupSchema, shortcutSchema, v } from '@/src/schemas';

const EXPORT_VERSION = '2.0';
type LayoutSettings = Pick<Settings, 'layout' | 'iconsPerRow' | 'desktopOrder' | 'desktopHiddenIds'>;
const layoutsSchema = v.object({
  active: v.oneOf(['group', 'dock'] as const),
  group: v.object({ iconsPerRow: v.number() }),
  dock: v.object({
    pinnedIds: v.array(v.string()),
    desktopOrder: v.array(v.string()),
    hiddenIds: v.array(v.string()),
  }),
});

function validIds(ids: readonly string[], allowed: Set<string>) {
  return [...new Set(ids)].filter((id) => allowed.has(id));
}

export function bookmarkBackup(shortcuts: Shortcut[], groups: ShortcutGroup[], settings: LayoutSettings): ExportData & { layouts: BookmarkLayouts } {
  const allowed = new Set(shortcuts.map(({ id }) => id));
  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    shortcuts,
    // Legacy readers still find the Dock pins in the system group.
    groups,
    layouts: {
      active: settings.layout === 'dock' ? 'dock' : 'group',
      group: { iconsPerRow: settings.iconsPerRow },
      dock: {
        pinnedIds: validIds(getDockIds(groups), allowed),
        desktopOrder: validIds(settings.desktopOrder ?? [], allowed),
        hiddenIds: validIds(settings.desktopHiddenIds ?? [], allowed),
      },
    },
  };
}

/**
 * 导出数据为 JSON 文件
 */
export function exportData(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `书签备份_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 解析导入的 JSON 文件
 */
export async function parseImportFile(file: File): Promise<ExportData> {
  const data = JSON.parse(await file.text()) as Partial<ExportData> | null;
  if (!Array.isArray(data?.shortcuts)) throw new Error('无效的数据格式：缺少 shortcuts');
  if (!Array.isArray(data.groups)) throw new Error('无效的数据格式：缺少 groups');

  const version = data.version ?? '1.0';
  if (version !== '1.0' && version !== EXPORT_VERSION) throw new Error('Unsupported backup version');
  const layouts = version === EXPORT_VERSION ? layoutsSchema.parse(data.layouts) : undefined;
  if (layouts && (!Number.isInteger(layouts.group.iconsPerRow) || layouts.group.iconsPerRow < 1)) {
    throw new Error('Invalid columns');
  }
  const exportedAt = typeof data.exportedAt === 'number' ? data.exportedAt : Date.now();
  const shortcuts = data.shortcuts.map((shortcut) => {
    if (!shortcut?.id || !shortcut.name || !shortcut.url) throw new Error('无效的快捷方式数据');
    const createdAt = shortcut.createdAt ?? exportedAt;
    return shortcutSchema.parse({ ...shortcut, createdAt, updatedAt: shortcut.updatedAt ?? createdAt });
  });
  const groups = data.groups.map((group) => {
    if (!group?.id || !group.name) throw new Error('无效的分组数据');
    const createdAt = group.createdAt ?? exportedAt;
    return groupSchema.parse({ ...group, createdAt, updatedAt: group.updatedAt ?? createdAt, isExpanded: group.isExpanded ?? true });
  });
  if (new Set(shortcuts.map(({ id }) => id)).size !== shortcuts.length ||
      new Set(groups.map(({ id }) => id)).size !== groups.length) throw new Error('Duplicate backup identifiers');
  return { version, exportedAt, shortcuts, groups, layouts };
}

/**
 * 导入模式
 */
export type ImportMode = 'merge' | 'replace';
export type RestoredBookmarks = {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  settings: Partial<LayoutSettings>;
};

/**
 * 合并导入数据
 */
export function mergeImportData(
  existingShortcuts: Shortcut[],
  existingGroups: ShortcutGroup[],
  importData: ExportData,
  settings: LayoutSettings,
): RestoredBookmarks {
  const now = Date.now();
  const idMap = new Map<string, string>(); // 旧ID -> 新ID

  // 为导入的快捷方式生成新ID（如果与现有ID冲突）
  const existingShortcutIds = new Set(existingShortcuts.map(s => s.id));
  const idsByUrl = new Map(existingShortcuts.map((shortcut) => [shortcut.url, shortcut.id]));

  const newShortcuts: Shortcut[] = [];
  for (const s of importData.shortcuts) {
    // 跳过重复URL
    const existingId = idsByUrl.get(s.url);
    if (existingId !== undefined) {
      idMap.set(s.id, existingId);
      continue;
    }

    let newId = s.id;
    if (existingShortcutIds.has(s.id)) {
      do { newId = `${s.id}_${crypto.randomUUID()}`; } while (existingShortcutIds.has(newId));
    }
    idMap.set(s.id, newId);
    existingShortcutIds.add(newId);
    idsByUrl.set(s.url, newId);

    newShortcuts.push({
      ...s,
      id: newId,
      updatedAt: now,
    });
  }

  // 为导入的分组生成新ID（如果与现有ID冲突）
  const existingGroupIds = new Set(existingGroups.map(g => g.id));
  const newGroups: ShortcutGroup[] = [];
  for (const g of importData.groups) {
    if (g.id === DOCK_GROUP_ID) continue;
    let newId = g.id;
    if (existingGroupIds.has(g.id)) {
      do { newId = `${g.id}_${crypto.randomUUID()}`; } while (existingGroupIds.has(newId));
    }
    existingGroupIds.add(newId);

    // 更新分组中的快捷方式ID引用
    const newShortcutIds = [...new Set(g.shortcutIds
      .map(oldId => idMap.get(oldId))
      .filter((newId): newId is string => newId !== undefined))];

    newGroups.push({
      ...g,
      id: newId,
      shortcutIds: newShortcutIds,
      updatedAt: now,
    });
  }

  let groups = [...existingGroups, ...newGroups];
  const mapIds = (ids: string[]) => ids.flatMap((id) => idMap.get(id) ?? []);
  const addedIds = new Set(newShortcuts.map(({ id }) => id));
  const imported = importData.layouts?.dock;
  const importedDock = mapIds(imported?.pinnedIds ?? getDockIds(importData.groups));
  if (importedDock.length) groups = setDockIds(groups, [...new Set([...getDockIds(existingGroups), ...importedDock])]);

  return {
    shortcuts: [...existingShortcuts, ...newShortcuts],
    groups,
    settings: imported ? {
      desktopOrder: [...new Set([
        ...(settings.desktopOrder ?? []),
        ...existingShortcuts.map(({ id }) => id),
        ...mapIds(imported.desktopOrder),
      ])],
      desktopHiddenIds: [...new Set([
        ...(settings.desktopHiddenIds ?? []),
        ...mapIds(imported.hiddenIds).filter((id) => addedIds.has(id)),
      ])],
    } : {},
  };
}

/**
 * 替换导入数据
 */
export function replaceImportData(importData: ExportData): RestoredBookmarks {
  const now = Date.now();

  const allowed = new Set(importData.shortcuts.map(({ id }) => id));
  const groups = importData.groups.map((group) => ({
    ...group, updatedAt: now, shortcutIds: validIds(group.shortcutIds, allowed),
  }));
  const layouts = importData.layouts;
  return {
    shortcuts: importData.shortcuts.map(s => ({ ...s, updatedAt: now })),
    groups: layouts ? setDockIds(groups, validIds(layouts.dock.pinnedIds, allowed)) : groups,
    settings: {
      ...(layouts && { layout: layouts.active, iconsPerRow: layouts.group.iconsPerRow }),
      desktopOrder: validIds(layouts?.dock.desktopOrder ?? [], allowed),
      desktopHiddenIds: validIds(layouts?.dock.hiddenIds ?? [], allowed),
    },
  };
}
