import { onMessage } from '@/messaging';
import { storage } from '@wxt-dev/storage';
import { STORAGE_KEY, SESSION_LIMITS } from '@/src/utils/constants';
import type { Shortcut, TabSession, TabInfo } from '@/src/utils/types';

// 存储键（带 local: 前缀）
const SHORTCUTS_KEY = `local:${STORAGE_KEY.SHORTCUTS}` as const;
const TAB_SESSIONS_KEY = `local:${STORAGE_KEY.TAB_SESSIONS}` as const;

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

  // 注册消息处理器 - 标签页会话管理
  onMessage('tab-sessions/save', async () => {
    try {
      // 获取所有窗口的所有标签页
      const allTabs = await browser.tabs.query({});

      // 过滤掉浏览器内部页面
      const validTabs: TabInfo[] = allTabs
        .filter(tab => {
          if (!tab.url) return false;
          // 只保存 http/https 协议的标签页
          return tab.url.startsWith('http://') || tab.url.startsWith('https://');
        })
        .map(tab => ({
          url: tab.url!,
          title: tab.title || tab.url!,
        }));

      // 限制每个存档最多 30 个标签页
      const tabs = validTabs.slice(0, SESSION_LIMITS.MAX_TABS_PER_SESSION);

      const now = Date.now();
      const newSession: TabSession = {
        id: now.toString(),
        title: `会话 - ${new Date(now).toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        createdAt: now,
        tabCount: tabs.length,
        tabs,
      };

      // 读取现有会话
      const sessions = await storage.getItem<TabSession[]>(TAB_SESSIONS_KEY) || [];

      // 队列机制：新存档插入头部，超出 5 个则淘汰末尾
      const updatedSessions = [newSession, ...sessions].slice(0, SESSION_LIMITS.MAX_SESSIONS);

      await storage.setItem(TAB_SESSIONS_KEY, updatedSessions);

      return { success: true, session: newSession };
    } catch (error) {
      console.error('[Background] Failed to save session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  });

  onMessage('tab-sessions/list', async () => {
    const sessions = await storage.getItem<TabSession[]>(TAB_SESSIONS_KEY);
    return sessions || [];
  });

  onMessage('tab-sessions/restore', async ({ data: sessionId }) => {
    try {
      const sessions = await storage.getItem<TabSession[]>(TAB_SESSIONS_KEY) || [];
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return { success: false, error: '会话未找到' };
      }

      // 批量打开标签页（最后一个标签页激活，其他在后台打开）
      for (let i = 0; i < session.tabs.length; i++) {
        const tab = session.tabs[i];
        await browser.tabs.create({
          url: tab.url,
          active: i === session.tabs.length - 1, // 最后一个标签页激活
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[Background] Failed to restore session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  });

  onMessage('tab-sessions/delete', async ({ data: sessionId }) => {
    try {
      const sessions = await storage.getItem<TabSession[]>(TAB_SESSIONS_KEY) || [];
      const filtered = sessions.filter(s => s.id !== sessionId);

      if (filtered.length === sessions.length) {
        return { success: false, error: '会话未找到' };
      }

      await storage.setItem(TAB_SESSIONS_KEY, filtered);
      return { success: true };
    } catch (error) {
      console.error('[Background] Failed to delete session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  });
});
