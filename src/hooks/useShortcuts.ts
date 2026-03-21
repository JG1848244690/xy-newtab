import { useState, useEffect, useCallback } from 'react';
import { storage } from '@wxt-dev/storage';
import type { Shortcut } from '@/src/utils/types';
import { STORAGE_KEY, DEFAULT_SHORTCUTS } from '@/src/utils/constants';

// 存储键（带 local: 前缀）
const SHORTCUTS_KEY = `local:${STORAGE_KEY.SHORTCUTS}` as const;

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  // 加载快捷方式
  useEffect(() => {
    storage.getItem<Shortcut[]>(SHORTCUTS_KEY).then((saved) => {
      if (saved && saved.length > 0) {
        setShortcuts(saved);
      } else {
        // 首次使用，设置默认值
        setShortcuts([...DEFAULT_SHORTCUTS]);
        storage.setItem(SHORTCUTS_KEY, [...DEFAULT_SHORTCUTS]);
      }
    });
  }, []);

  // 保存快捷方式
  const saveShortcuts = useCallback(async (newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    await storage.setItem(SHORTCUTS_KEY, newShortcuts);
  }, []);

  // 添加快捷方式
  const addShortcut = useCallback(async (data: { name: string; url: string; icon?: string }) => {
    const now = Date.now();
    const newShortcut: Shortcut = {
      id: now.toString(),
      name: data.name,
      url: data.url.startsWith('http') ? data.url : `https://${data.url}`,
      icon: data.icon,
      createdAt: now,
      updatedAt: now,
    };

    // 从 storage 读取最新值，避免闭包问题
    const current = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    const updated = [...current, newShortcut];
    await saveShortcuts(updated);
    return newShortcut;
  }, [saveShortcuts]);

  // 批量添加快捷方式
  const addShortcuts = useCallback(async (items: { name: string; url: string }[]) => {
    // 从 storage 读取最新值
    const current = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    const existingUrls = new Set(current.map(s => s.url));

    const now = Date.now();
    const newShortcuts: Shortcut[] = [];
    let idCounter = now;

    for (const item of items) {
      const url = item.url.startsWith('http') ? item.url : `https://${item.url}`;
      // 跳过重复
      if (!existingUrls.has(url)) {
        newShortcuts.push({
          id: (idCounter++).toString(),
          name: item.name,
          url,
          createdAt: now,
          updatedAt: now,
        });
        existingUrls.add(url);
      }
    }

    if (newShortcuts.length > 0) {
      const updated = [...current, ...newShortcuts];
      await saveShortcuts(updated);
    }

    return newShortcuts.length;
  }, [saveShortcuts]);

  // 删除快捷方式
  const removeShortcut = useCallback(async (id: string) => {
    // 从 storage 读取最新值
    const current = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    await saveShortcuts(current.filter((s) => s.id !== id));
  }, [saveShortcuts]);

  // 批量删除快捷方式
  const removeShortcuts = useCallback(async (ids: string[]) => {
    // 从 storage 读取最新值
    const current = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    const idsSet = new Set(ids);
    await saveShortcuts(current.filter((s) => !idsSet.has(s.id)));
  }, [saveShortcuts]);

  // 更新快捷方式
  const updateShortcut = useCallback(async (id: string, data: Partial<Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>>) => {
    // 从 storage 读取最新值
    const current = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    await saveShortcuts(
      current.map((s) =>
        s.id === id
          ? {
              ...s,
              ...data,
              url: data.url && !data.url.startsWith('http') ? `https://${data.url}` : data.url || s.url,
              updatedAt: Date.now(),
            }
          : s
      )
    );
  }, [saveShortcuts]);

  return {
    shortcuts,
    addShortcut,
    addShortcuts,
    removeShortcut,
    removeShortcuts,
    updateShortcut,
  };
}
