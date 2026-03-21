/**
 * 常量定义
 * 所有可复用或可配置的值集中管理
 */

import type { SearchEngineOption, Settings } from './types';

// 扩展名称
export const EXTENSION_NAME = '序言';

// Storage Keys
export const STORAGE_KEY = {
  SETTINGS: 'settings',
  SHORTCUTS: 'shortcuts',
} as const;

// 默认快捷方式
export const DEFAULT_SHORTCUTS = [
  { id: '1', name: 'Google', url: 'https://www.google.com', createdAt: Date.now(), updatedAt: Date.now() },
  { id: '2', name: 'GitHub', url: 'https://github.com', createdAt: Date.now(), updatedAt: Date.now() },
  { id: '3', name: 'YouTube', url: 'https://www.youtube.com', createdAt: Date.now(), updatedAt: Date.now() },
  { id: '4', name: 'Twitter', url: 'https://twitter.com', createdAt: Date.now(), updatedAt: Date.now() },
];

// 搜索引擎选项
export const SEARCH_ENGINES: SearchEngineOption[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: '🔍' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: '🔎' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: '🦆' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', icon: '🌐' },
];

// 默认设置
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  searchEngine: 'google',
  iconsPerRow: 8,
};

// UI 配置
export const UI_CONFIG = {
  POPUP_WIDTH: 320,
  SHORTCUT_ICON_SIZE: 48,
  GRID_COLS: {
    sm: 5,
    md: 6,
    lg: 8,
  },
  DEFAULT_ICONS_PER_ROW: 8,
  MIN_ICONS_PER_ROW: 4,
  MAX_ICONS_PER_ROW: 12,
} as const;

// 样式常量
export const STYLE = {
  // Tab 激活态
  TAB_ACTIVE: 'text-blue-400 border-b-2 border-blue-400',
  TAB_INACTIVE: 'text-gray-400 hover:text-white',
} as const;
