import { onMessage, type ChromeBookmark } from '@/messaging';
import { extractDomain, loadFavicon } from '@/src/utils/faviconCache';
import { STORAGE_KEYS } from '@/src/store/keys';
import type { Shortcut } from '@/src/utils/types';
import { changeTodo, fetchTodos } from '@/src/services/todos';
import { fetchWeather } from '@/src/services/weather';
import { autoBackupSupported, backupNow, getBackupStatus, registerBookmarkAutoBackup, setBackupEnabled } from '@/src/services/bookmarkAutoBackup';

export default defineBackground(() => {
  onMessage('favicon/get', ({ data }) => loadFavicon(data));
  onMessage('todos/list', ({ data }) => fetchTodos(data));
  onMessage('todos/change', ({ data }) => changeTodo(data));
  onMessage('weather/get', ({ data }) => fetchWeather(data));
  if (autoBackupSupported) {
    registerBookmarkAutoBackup();
    onMessage('backup/status', () => getBackupStatus());
    onMessage('backup/enable', ({ data }) => setBackupEnabled(data));
    onMessage('backup/save', () => backupNow());
  }

  browser.storage.onChanged.addListener((changes, area) => {
    const change = changes[STORAGE_KEYS.shortcuts];
    if (area !== 'local' || !change || !Array.isArray(change.newValue)) return;
    const previous = Array.isArray(change.oldValue) ? change.oldValue as Shortcut[] : [];
    const knownDomains = new Set(previous.map(({ url }) => extractDomain(url)));
    const addedDomains = new Set((change.newValue as Shortcut[]).map(({ url }) => extractDomain(url)));
    for (const domain of addedDomains) {
      if (!knownDomains.has(domain)) void loadFavicon(domain);
    }
  });

  onMessage('bookmarks/list', async () => {
    try {
      const tree = await browser.bookmarks.getTree();
      const bookmarks: ChromeBookmark[] = [];
      const collect = (nodes: typeof tree, folder: string[]) => {
        for (const node of nodes) {
          if (node.url && /^https?:\/\//i.test(node.url)) {
            bookmarks.push({ id: node.id, name: node.title.trim() || node.url, url: node.url, folder });
          }
          if (node.children) collect(node.children, node.title ? [...folder, node.title] : folder);
        }
      };
      collect(tree, []);
      return { bookmarks, success: true };
    } catch {
      return { success: false };
    }
  });
});
