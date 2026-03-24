/**
 * 导入导出工具函数
 */

import type { Shortcut, ShortcutGroup, ExportData } from './types';
import { STORAGE_KEY, DEFAULT_SHORTCUTS, DEFAULT_GROUPS } from './constants';

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
export function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        // 验证数据格式
        if (!data.shortcuts || !Array.isArray(data.shortcuts)) {
          throw new Error('无效的数据格式：缺少 shortcuts');
        }
        if (!data.groups || !Array.isArray(data.groups)) {
          throw new Error('无效的数据格式：缺少 groups');
        }

        // 验证快捷方式格式
        for (const s of data.shortcuts) {
          if (!s.id || !s.name || !s.url) {
            throw new Error('无效的快捷方式数据');
          }
        }

        // 验证分组格式
        for (const g of data.groups) {
          if (!g.id || !g.name || !Array.isArray(g.shortcutIds)) {
            throw new Error('无效的分组数据');
          }
        }

        resolve(data);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
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
  const existingUrls = new Set(existingShortcuts.map(s => s.url));

  const newShortcuts: Shortcut[] = [];
  for (const s of importData.shortcuts) {
    // 跳过重复URL
    if (existingUrls.has(s.url)) continue;

    let newId = s.id;
    if (existingShortcutIds.has(s.id)) {
      newId = `${s.id}_${now}`;
    }
    idMap.set(s.id, newId);
    existingShortcutIds.add(newId);
    existingUrls.add(s.url);

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
    let newId = g.id;
    if (existingGroupIds.has(g.id)) {
      newId = `${g.id}_${now}`;
    }
    existingGroupIds.add(newId);

    // 更新分组中的快捷方式ID引用
    const newShortcutIds = g.shortcutIds
      .map(oldId => idMap.get(oldId))
      .filter((newId): newId is string => newId !== undefined);

    newGroups.push({
      ...g,
      id: newId,
      shortcutIds: newShortcutIds,
      updatedAt: now,
    });
  }

  return {
    shortcuts: [...existingShortcuts, ...newShortcuts],
    groups: [...existingGroups, ...newGroups],
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
