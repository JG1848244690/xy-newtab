/**
 * 全局类型定义
 */

// 快捷方式
export interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

// 页面类型
export type PageType = 'home' | 'detail' | 'unknown';

// 扩展 Window 类型
declare global {
  interface Window {
    __extensionInitialized?: boolean;
    __currentPage?: PageType;
    __currentUI?: unknown;
  }
}

export {};
