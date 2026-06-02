import { defineExtensionMessaging } from '@webext-core/messaging';
import type { Shortcut, TabSession } from '@/src/utils/types';

// 定义消息协议：函数签名 = 参数类型 => 返回值类型
interface ProtocolMap {
  // 快捷方式相关
  'shortcuts/get-all': () => Shortcut[];
  'shortcuts/add': (shortcut: Omit<Shortcut, 'id'>) => Shortcut;
  'shortcuts/add-batch': (shortcuts: Omit<Shortcut, 'id'>[]) => Shortcut[];
  'shortcuts/remove': (id: string) => boolean;

  // 设置相关
  'settings/get': () => Record<string, unknown>;
  'settings/set': (settings: Record<string, unknown>) => boolean;

  // Favicon 获取（通过 background 绕过 CORS）
  'favicon/fetch': (url: string) => string | null;

  // 从 Chrome 新标签页导入书签
  'shortcuts/import-from-newtab': () => { shortcuts: { name: string; url: string }[]; success: boolean; error?: string };

  // 标签页会话管理
  'tab-sessions/save': () => { success: boolean; session?: TabSession; error?: string };
  'tab-sessions/list': () => TabSession[];
  'tab-sessions/restore': (sessionId: string) => { success: boolean; error?: string };
  'tab-sessions/delete': (sessionId: string) => { success: boolean; error?: string };
}

// 创建 messenger
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
