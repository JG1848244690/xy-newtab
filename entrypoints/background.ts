import { onMessage } from '@/messaging';
import { storage } from '@wxt-dev/storage';
import { setupSyncInit, pullAndMerge, uploadLocal, downloadCloud } from '@/src/utils/syncAuto';
import {
  loginWithGoogle,
  saveLoginLocally,
  readSessionToken,
  readCurrentUser,
  clearLoginLocally,
} from '@/src/utils/googleAuth';
import { SYNC_API_BASE_URL, SYNC_API } from '@/src/utils/syncConfig';
import { LOCAL_STORAGE_KEY } from '@/src/utils/constants';
import type { Shortcut } from '@/src/utils/types';

// 存储键（带 local: 前缀，详见 LOCAL_STORAGE_KEY）
const SHORTCUTS_KEY = LOCAL_STORAGE_KEY.SHORTCUTS;
const GROUPS_KEY = LOCAL_STORAGE_KEY.GROUPS;

/*
 * ============================================================================
 * 云同步说明(手动同步模型)
 * ============================================================================
 *
 * 当前方案:独立后端 (SYNC_API_BASE_URL) + Google OAuth 授权码模式。
 *   - setupSyncInit() 只初始化 deviceId,不再订阅自动 push
 *   - 'sync/on-new-tab'  首次/距上次>30min 时 pullAndMerge(由 newtab 节流)
 *   - 'sync/upload'      手动上传(本地→云)
 *   - 'sync/download'    手动下载(云→本地)
 *   - 用户改书签/分组 → markDirty → UI 红点;上传/下载成功 → clearDirty
 *   - 详细逻辑在 src/utils/syncAuto.ts,脏标记在 src/utils/syncDirty.ts,
 *     鉴权在 src/utils/googleAuth.ts
 *
 * 只同步 shortcuts + groups(书签/分组),不涉及标签页会话。
 * ============================================================================
 */

export default defineBackground(() => {
  console.log('[Extension] Background script loaded', { id: browser.runtime.id });

  // init: 只初始化 deviceId(不再订阅自动 push)
  setupSyncInit().catch((e) => console.warn('[sync] init failed:', e));

  // ===== 手动同步 =====

  // 新标签页打开时(newtab/App.tsx 节流:距上次>30min 才发)→ 拉取云端 + merge
  onMessage('sync/on-new-tab', async () => {
    return await pullAndMerge();
  });

  // 手动上传:本地 → 云
  onMessage('sync/upload', async () => {
    return await uploadLocal();
  });

  // 手动下载:云 → 本地
  onMessage('sync/download', async () => {
    return await downloadCloud();
  });

  // ===== Auth =====

  onMessage('auth/get-user', async () => {
    return await readCurrentUser();
  });

  onMessage('auth/login', async () => {
    try {
      const { sessionToken, user } = await loginWithGoogle();
      await saveLoginLocally(sessionToken, user);
      // 登录后立即拉取云端 merge(把别的设备的数据拉下来)
      void pullAndMerge().catch((e) => console.warn('[sync] post-login pull failed:', e));
      return { success: true, user };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Auth] login failed:', message);
      return { success: false, error: message };
    }
  });

  onMessage('auth/logout', async () => {
    try {
      const token = await readSessionToken();
      if (token) {
        try {
          await fetch(`${SYNC_API_BASE_URL}${SYNC_API.GOOGLE_LOGOUT}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (e) {
          console.warn('[Auth] backend logout failed (continuing):', e);
        }
      }
      await clearLoginLocally();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  });

  // ===== 快捷方式 / 书签 =====

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
