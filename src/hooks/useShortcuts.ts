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
    await saveShortcuts([...shortcuts, newShortcut]);
    return newShortcut;
  }, [shortcuts, saveShortcuts]);

  // 删除快捷方式
  const removeShortcut = useCallback(async (id: string) => {
    await saveShortcuts(shortcuts.filter((s) => s.id !== id));
  }, [shortcuts, saveShortcuts]);

  // 更新快捷方式
  const updateShortcut = useCallback(async (id: string, data: Partial<Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await saveShortcuts(
      shortcuts.map((s) =>
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
  }, [shortcuts, saveShortcuts]);

  return {
    shortcuts,
    addShortcut,
    removeShortcut,
    updateShortcut,
  };
}
