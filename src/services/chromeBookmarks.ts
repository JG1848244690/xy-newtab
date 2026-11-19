import { sendMessage } from '@/messaging';

export async function listChromeBookmarks() {
  const result = await sendMessage('bookmarks/list');
  if (!result.success) throw new Error('Unable to read browser bookmarks');
  return result.bookmarks;
}
