/**
 * 全局类型定义
 */

// 快捷方式
export interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
}

// 搜索引擎
export type SearchEngineType = 'google' | 'bing' | 'duckduckgo' | 'baidu';

export interface SearchEngineOption {
  id: SearchEngineType;
  name: string;
  url: string;
  icon: string;
}

// 主题
export type Theme = 'light' | 'dark' | 'system';

// 设置
export interface Settings {
  theme: Theme;
  searchEngine: SearchEngineType;
  iconsPerRow: number;
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
