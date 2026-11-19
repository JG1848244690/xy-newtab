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
  order?: number; // 排序顺序
  createdAt: number;
  updatedAt: number;
}

// 布局类型
// - grid: 旧版持久化值，界面按分组模式显示
// - group: 分组卡片列表
// - dock: 底部 Dock（默认）
export type LayoutType = 'grid' | 'group' | 'dock';

// 背景适配方式
export type BackgroundSize = 'cover' | 'contain' | 'auto' | '100% 100%';

// 背景类型
export type BackgroundType = 'none' | 'color' | 'image' | 'video' | 'scene';

// 背景设置
export interface BackgroundSetting {
  type: BackgroundType;
  color?: string; // 背景色，如 '#1a1a2e'
  imageUrl?: string; // 背景图 URL
  size?: BackgroundSize; // 适配方式
  opacity?: number; // 透明度 0-1
  // 视频背景:fileName / muted / size 仅作显示/控制用,实际 blob 在 IndexedDB
  videoFileName?: string;
  muted?: boolean;
  sceneId?: string;
  sceneName?: string;
}

// 设置
export interface Settings {
  desktopOrder?: string[];
  desktopHiddenIds?: string[];
  iconsPerRow: number;
  layout: LayoutType; // 布局类型
  background?: BackgroundSetting; // 背景设置
  language?: 'zh_CN' | 'en'; // UI 语言;未设置时按 navigator.language 自动推断
}

// 页面类型
export type PageType = 'home' | 'detail' | 'unknown';

// 导出数据格式
export interface ExportData {
  version: string; // 版本号，用于兼容性
  exportedAt: number; // 导出时间戳
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
}

// 扩展 Window 类型
declare global {
  interface Window {
    __extensionInitialized?: boolean;
    __currentPage?: PageType;
    __currentUI?: unknown;
  }
}

export {};
