import { useState, useEffect, useCallback } from 'react';
import { storage } from '@wxt-dev/storage';
import type { ShortcutGroup } from '@/src/utils/types';
import { STORAGE_KEY, DEFAULT_GROUPS } from '@/src/utils/constants';

// 存储键（带 local: 前缀）
const GROUPS_KEY = `local:${STORAGE_KEY.GROUPS}` as const;

export function useGroups() {
  const [groups, setGroups] = useState<ShortcutGroup[]>([]);

  // 加载分组
  useEffect(() => {
    storage.getItem<ShortcutGroup[]>(GROUPS_KEY).then((saved) => {
      if (saved) {
        setGroups(saved);
      } else {
        setGroups(DEFAULT_GROUPS);
      }
    });
  }, []);

  // 保存分组
  const saveGroups = useCallback(async (newGroups: ShortcutGroup[]) => {
    setGroups(newGroups);
    await storage.setItem(GROUPS_KEY, newGroups);
  }, []);

  // 添加分组
  const addGroup = useCallback(async (data: { name: string; color?: string }) => {
    const now = Date.now();
    const newGroup: ShortcutGroup = {
      id: now.toString(),
      name: data.name,
      color: data.color,
      shortcutIds: [],
      isExpanded: true,
      createdAt: now,
      updatedAt: now,
    };

    const current = await storage.getItem<ShortcutGroup[]>(GROUPS_KEY) || [];
    const updated = [...current, newGroup];
    await saveGroups(updated);
    return newGroup;
  }, [saveGroups]);

  // 更新分组
  const updateGroup = useCallback(async (id: string, data: Partial<Omit<ShortcutGroup, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const current = await storage.getItem<ShortcutGroup[]>(GROUPS_KEY) || [];
    await saveGroups(
      current.map((g) =>
        g.id === id
          ? { ...g, ...data, updatedAt: Date.now() }
          : g
      )
    );
  }, [saveGroups]);

  // 删除分组
  const removeGroup = useCallback(async (id: string) => {
    const current = await storage.getItem<ShortcutGroup[]>(GROUPS_KEY) || [];
    await saveGroups(current.filter((g) => g.id !== id));
  }, [saveGroups]);

  // 切换分组展开状态
  const toggleGroupExpand = useCallback(async (id: string) => {
    const current = await storage.getItem<ShortcutGroup[]>(GROUPS_KEY) || [];
    await saveGroups(
      current.map((g) =>
        g.id === id ? { ...g, isExpanded: !g.isExpanded } : g
      )
    );
  }, [saveGroups]);

  // 添加快捷方式到分组
  const addShortcutToGroup = useCallback(async (groupId: string, shortcutId: string) => {
    const current = await storage.getItem<ShortcutGroup[]>(GROUPS_KEY) || [];
    await saveGroups(
      current.map((g) =>
        g.id === groupId && !g.shortcutIds.includes(shortcutId)
          ? { ...g, shortcutIds: [...g.shortcutIds, shortcutId], updatedAt: Date.now() }
          : g
      )
    );
  }, [saveGroups]);

  // 从分组移除快捷方式
  const removeShortcutFromGroup = useCallback(async (groupId: string, shortcutId: string) => {
    const current = await storage.getItem<ShortcutGroup[]>(GROUPS_KEY) || [];
    await saveGroups(
      current.map((g) =>
        g.id === groupId
          ? { ...g, shortcutIds: g.shortcutIds.filter(id => id !== shortcutId), updatedAt: Date.now() }
          : g
      )
    );
  }, [saveGroups]);

  // 获取快捷方式所属的分组
  const getGroupByShortcutId = useCallback((shortcutId: string): ShortcutGroup | undefined => {
    return groups.find(g => g.shortcutIds.includes(shortcutId));
  }, [groups]);

  // 获取未分组的快捷方式 ID
  const getUngroupedShortcutIds = useCallback((allShortcutIds: string[]): string[] => {
    const groupedIds = new Set(groups.flatMap(g => g.shortcutIds));
    return allShortcutIds.filter(id => !groupedIds.has(id));
  }, [groups]);

  // 迁移快捷方式到目标分组
  const moveShortcutsToGroup = useCallback(async (
    sourceGroupId: string | null, // null 表示从"未分组"迁移
    targetGroupId: string | null, // null 表示迁移到"未分组"
    shortcutIds: string[]
  ) => {
    const current = await storage.getItem<ShortcutGroup[]>(GROUPS_KEY) || [];
    const now = Date.now();

    const updated = current.map((g) => {
      // 从源分组移除
      if (g.id === sourceGroupId) {
        return {
          ...g,
          shortcutIds: g.shortcutIds.filter(id => !shortcutIds.includes(id)),
          updatedAt: now,
        };
      }
      // 添加到目标分组
      if (g.id === targetGroupId) {
        const newIds = [...new Set([...g.shortcutIds, ...shortcutIds])];
        return {
          ...g,
          shortcutIds: newIds,
          updatedAt: now,
        };
      }
      return g;
    });

    await saveGroups(updated);
  }, [saveGroups]);

  // 批量导入分组（用于导入功能）
  const importGroups = useCallback(async (newGroups: ShortcutGroup[]) => {
    await saveGroups(newGroups);
  }, [saveGroups]);

  return {
    groups,
    addGroup,
    updateGroup,
    removeGroup,
    toggleGroupExpand,
    addShortcutToGroup,
    removeShortcutFromGroup,
    moveShortcutsToGroup,
    getGroupByShortcutId,
    getUngroupedShortcutIds,
    importGroups,
  };
}
