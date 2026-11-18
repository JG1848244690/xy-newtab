import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  'favicon/get': (domain: string) => string | null;
  'shortcuts/import-from-newtab': () => {
    shortcuts: { name: string; url: string }[];
    success: boolean;
    error?: string;
  };
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
