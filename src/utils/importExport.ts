/**
 * 导入导出工具函数
 */

import type { Shortcut, ShortcutGroup, ExportData } from './types';
import { DOCK_GROUP_ID } from './constants';
import { getDockIds, setDockIds } from '@/src/services/groups';
import { groupSchema, shortcutSchema } from '@/src/schemas';

const EXPORT_VERSION = '1.0';

/**
 * 导出数据为 JSON 文件
 */
export function exportData(shortcuts: Shortcut[], groups: ShortcutGroup[]): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    shortcuts,
    groups,
  };

  const json = JSON.stringify(exportData, null, 2);
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
  return { version: data.version ?? EXPORT_VERSION, exportedAt, shortcuts, groups };
}

/**
 * 导入模式
 */
export type ImportMode = 'merge' | 'replace';

/**
 * 合并导入数据
 */
export function mergeImportData(
  existingShortcuts: Shortcut[],
  existingGroups: ShortcutGroup[],
  importData: ExportData
): { shortcuts: Shortcut[]; groups: ShortcutGroup[] } {
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
  const importedDock = getDockIds(importData.groups).flatMap((oldId) => {
    const id = idMap.get(oldId);
    return id === undefined ? [] : [id];
  });
  if (importedDock.length) groups = setDockIds(groups, [...new Set([...getDockIds(existingGroups), ...importedDock])]);

  return {
    shortcuts: [...existingShortcuts, ...newShortcuts],
    groups,
  };
}

/**
 * 替换导入数据
 */
export function replaceImportData(importData: ExportData): { shortcuts: Shortcut[]; groups: ShortcutGroup[] } {
  const now = Date.now();

  return {
    shortcuts: importData.shortcuts.map(s => ({ ...s, updatedAt: now })),
    groups: importData.groups.map(g => ({ ...g, updatedAt: now })),
  };
}
