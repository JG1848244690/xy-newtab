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

// 快捷方式分组
export interface ShortcutGroup {
  id: string;
  name: string;
  icon?: string;
  color?: string; // 分组颜色
  shortcutIds: string[]; // 分组包含的快捷方式 ID
  isExpanded: boolean; // 是否展开
  createdAt: number;
  updatedAt: number;
}

// 布局类型
export type LayoutType = 'grid' | 'group';

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

// 背景适配方式
export type BackgroundSize = 'cover' | 'contain' | 'auto' | '100% 100%';

// 背景类型
export type BackgroundType = 'none' | 'color' | 'image';

// 背景设置
export interface BackgroundSetting {
  type: BackgroundType; // 'none' | 'color' | 'image'
  color?: string; // 背景色，如 '#1a1a2e'
  imageUrl?: string; // 背景图 URL
  size?: BackgroundSize; // 适配方式
  opacity?: number; // 透明度 0-1
}

// 设置
export interface Settings {
  theme: Theme;
  searchEngine: SearchEngineType;
  iconsPerRow: number;
  layout: LayoutType; // 布局类型
  background?: BackgroundSetting; // 背景设置
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
