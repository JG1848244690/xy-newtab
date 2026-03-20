import { useState, useEffect } from 'react';
import { storage } from '@wxt-dev/storage';
import { Shortcut } from '@/src/utils/types';
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
  const saveShortcuts = async (newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    await storage.setItem(SHORTCUTS_KEY, newShortcuts);
  };

  // 添加快捷方式
  const addShortcut = async (shortcut?: Partial<Shortcut>) => {
    const newShortcut: Shortcut = {
      id: Date.now().toString(),
      name: shortcut?.name || '新网站',
      url: shortcut?.url || 'https://example.com',
      icon: shortcut?.icon,
    };
    await saveShortcuts([...shortcuts, newShortcut]);
  };

  // 删除快捷方式
  const removeShortcut = async (id: string) => {
    await saveShortcuts(shortcuts.filter((s) => s.id !== id));
  };

  // 更新快捷方式
  const updateShortcut = async (id: string, data: Partial<Shortcut>) => {
    await saveShortcuts(
      shortcuts.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  };

  return {
    shortcuts,
    addShortcut,
    removeShortcut,
    updateShortcut,
  };
}
