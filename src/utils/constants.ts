/**
 * 常量定义
 * 所有可复用或可配置的值集中管理
 */

// 扩展名称
export const EXTENSION_NAME = '快捷标签';

// Storage Keys
export const STORAGE_KEY = {
  SETTINGS: 'settings',
  SHORTCUTS: 'shortcuts',
} as const;

// 默认快捷方式
export const DEFAULT_SHORTCUTS = [
  { id: '1', name: 'Google', url: 'https://www.google.com' },
  { id: '2', name: 'GitHub', url: 'https://github.com' },
  { id: '3', name: 'YouTube', url: 'https://www.youtube.com' },
  { id: '4', name: 'Twitter', url: 'https://twitter.com' },
] as const;

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
