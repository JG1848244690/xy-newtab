import { defineExtensionMessaging } from '@webext-core/messaging';

export interface ChromeBookmark {
  id: string;
  name: string;
  url: string;
  folder: string[];
}

interface ProtocolMap {
  'favicon/get': (domain: string) => string | null;
  'bookmarks/list': () => { success: true; bookmarks: ChromeBookmark[] } | { success: false };
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
