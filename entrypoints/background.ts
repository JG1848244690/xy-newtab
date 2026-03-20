import { onMessage } from '@/messaging';
import { storage } from '@wxt-dev/storage';
import { STORAGE_KEY } from '@/src/utils/constants';
import type { Shortcut } from '@/src/utils/types';

// 存储键（带 local: 前缀）
const SHORTCUTS_KEY = `local:${STORAGE_KEY.SHORTCUTS}` as const;

export default defineBackground(() => {
  console.log('[Extension] Background script loaded', { id: browser.runtime.id });

  // 注册消息处理器
  onMessage('shortcuts/get-all', async () => {
    const shortcuts = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY);
    return shortcuts || [];
  });

  onMessage('shortcuts/add', async ({ data }) => {
    const shortcuts = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    const newShortcut: Shortcut = {
      ...data,
      id: Date.now().toString(),
    };
    await storage.setItem(SHORTCUTS_KEY, [...shortcuts, newShortcut]);
    return newShortcut;
  });

  onMessage('shortcuts/remove', async ({ data: id }) => {
    const shortcuts = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    const filtered = shortcuts.filter(s => s.id !== id);
    await storage.setItem(SHORTCUTS_KEY, filtered);
    return true;
  });
});
