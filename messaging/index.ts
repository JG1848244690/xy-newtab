import { defineExtensionMessaging } from '@webext-core/messaging';
import type { TodoChange, TodoChangeResult, TodoListResult } from '@/src/services/todos';
import type { WeatherRequest, WeatherResult } from '@/src/services/weather';
import type { BackupStatus } from '@/src/services/bookmarkAutoBackup';

export interface ChromeBookmark {
  id: string;
  name: string;
  url: string;
  folder: string[];
}

interface ProtocolMap {
  'favicon/get': (domain: string) => string | null;
  'bookmarks/list': () => { success: true; bookmarks: ChromeBookmark[] } | { success: false };
  'todos/list': (date: string) => TodoListResult;
  'todos/change': (change: TodoChange) => TodoChangeResult;
  'weather/get': (request: WeatherRequest) => WeatherResult;
  'backup/status': () => BackupStatus;
  'backup/enable': (enabled: boolean) => BackupStatus;
  'backup/save': () => BackupStatus;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
