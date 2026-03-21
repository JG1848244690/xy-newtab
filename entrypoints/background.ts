import { onMessage } from '@/messaging';
import { storage } from '@wxt-dev/storage';
import { STORAGE_KEY } from '@/src/utils/constants';
import type { Shortcut } from '@/src/utils/types';

// 存储键（带 local: 前缀）
const SHORTCUTS_KEY = `local:${STORAGE_KEY.SHORTCUTS}` as const;

export default defineBackground(() => {
  console.log('[Extension] Background script loaded', { id: browser.runtime.id });

  // 注册消息处理器 - 快捷方式
  onMessage('shortcuts/get-all', async () => {
    const shortcuts = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY);
    return shortcuts || [];
  });

  onMessage('shortcuts/add', async ({ data }) => {
    const shortcuts = await storage.getItem<Shortcut[]>(SHORTCUTS_KEY) || [];
    const newShortcut: Shortcut = {
      ...data,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

  // 注册消息处理器 - Favicon fetch（绕过 CORS）
  onMessage('favicon/fetch', async ({ data: url }) => {
    try {
      const response = await fetch(url, {
        credentials: 'omit',
      });

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          resolve('');
        };
        reader.readAsDataURL(blob);
      });

      return base64 || null;
    } catch (error) {
        console.error('[Background] Failed to fetch favicon:', error);
        return null;
    }
  });

  // 注册消息处理器 - 从 Chrome 书签导入快捷方式
  onMessage('shortcuts/import-from-newtab', async () => {
    try {
      // 使用 Chrome Bookmarks API 读取书签
      const bookmarks = await browser.bookmarks.getTree();

      const shortcuts: { name: string; url: string }[] = [];

      // 递归遍历书签树
      const traverseBookmarks = (nodes: typeof bookmarks) => {
        for (const node of nodes) {
          if (node.url && node.title) {
            // 只导入 http/https 链接
            if (node.url.startsWith('http://') || node.url.startsWith('https://')) {
              shortcuts.push({
                name: node.title,
                url: node.url,
              });
            }
          }
          if (node.children) {
            traverseBookmarks(node.children);
          }
        }
      };

      traverseBookmarks(bookmarks);

      return {
        shortcuts,
        success: true,
      };
    } catch (error) {
      console.error('[Background] Failed to import bookmarks:', error);
      return {
        shortcuts: [],
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  });
});
