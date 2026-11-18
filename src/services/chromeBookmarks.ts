import { sendMessage } from '@/messaging';

export async function importChromeBookmarks(add: (items: { name: string; url: string }[]) => number) {
  const result = await sendMessage('shortcuts/import-from-newtab');
  if (!result.success) throw new Error(result.error);
  const count = result.shortcuts.length;
  const added = count === 0 ? 0 : add(result.shortcuts);
  return { count, added, skipped: count - added };
}
