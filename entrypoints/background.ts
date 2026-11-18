import { onMessage } from '@/messaging';
import { extractDomain, loadFavicon } from '@/src/utils/faviconCache';
import { STORAGE_KEYS } from '@/src/store/keys';
import type { Shortcut } from '@/src/utils/types';

export default defineBackground(() => {
  onMessage('favicon/get', ({ data }) => loadFavicon(data));

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

  onMessage('shortcuts/import-from-newtab', async () => {
    try {
      const tree = await browser.bookmarks.getTree();
      const shortcuts: { name: string; url: string }[] = [];
      const collect = (nodes: typeof tree) => {
        for (const node of nodes) {
          if (node.title && node.url && /^https?:\/\//i.test(node.url)) {
            shortcuts.push({ name: node.title, url: node.url });
          }
          if (node.children) collect(node.children);
        }
      };
      collect(tree);
      return { shortcuts, success: true };
    } catch (error) {
      return {
        shortcuts: [],
        success: false,
        error: error instanceof Error ? error.message : undefined,
      };
    }
  });
});
