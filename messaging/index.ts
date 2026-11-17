import { defineExtensionMessaging } from '@webext-core/messaging';
import type { Shortcut } from '@/src/utils/types';

// 消息协议: 函数名 => 参数类型 => 返回值类型
interface ProtocolMap {
  // 快捷方式相关
  'shortcuts/get-all': () => Shortcut[];
  'shortcuts/add': (shortcut: Omit<Shortcut, 'id'>) => Shortcut;
  'shortcuts/add-batch': (items: Omit<Shortcut, 'id'>[]) => Shortcut[];
  'shortcuts/remove': (id: string) => boolean;

  // 设置相关
  'settings/get': () => Record<string, unknown>;
  'settings/set': (settings: Record<string, unknown>) => boolean;

  // Favicon 获取(通过 background 绕过 CORS)
  'favicon/fetch': (url: string) => string | null;

  // 一键从 Chrome 书签导入
  'shortcuts/import-from-newtab': () => { shortcuts: { name: string; url: string }[]; success: boolean; error?: string };
}

// 创建 messenger
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
