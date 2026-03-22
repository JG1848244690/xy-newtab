import { useState, useEffect, useCallback } from 'react';
import { storage } from '@wxt-dev/storage';
import type { Theme } from '@/src/utils/types';
import { STORAGE_KEY, DEFAULT_SETTINGS } from '@/src/utils/constants';

const SETTINGS_KEY = `local:${STORAGE_KEY.SETTINGS}` as const;

const THEME_CACHE_KEY = 'theme-cache';

/**
 * 保存主题到 localStorage 缓存（用于防止闪烁）
 */
function saveThemeCache(theme: Theme) {
  localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ theme }));
}

/**
 * 应用主题到 DOM
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  // 保存到 localStorage 缓存
  saveThemeCache(theme);
}

/**
 * 检查浏览器是否支持 View Transitions API
 */
function supportsViewTransitions(): boolean {
  return 'startViewTransition' in document;
}

/**
 * 主题切换 Hook
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_SETTINGS.theme);
  const [mounted, setMounted] = useState(false);

  // 加载主题设置
  useEffect(() => {
    storage.getItem<{ theme: Theme }>(SETTINGS_KEY).then((settings) => {
      const savedTheme = settings?.theme || DEFAULT_SETTINGS.theme;
      setThemeState(savedTheme);
      applyTheme(savedTheme);
      setMounted(true);
    });
  }, []);

  // 设置主题（带动画）
  const setTheme = useCallback(async (newTheme: Theme, event?: React.MouseEvent) => {
    // 设置扩散起点坐标（使用点击位置或右上角按钮位置）
    const root = document.documentElement;
    if (event?.clientX !== undefined && event?.clientY !== undefined) {
      root.style.setProperty('--theme-x', `${event.clientX}px`);
      root.style.setProperty('--theme-y', `${event.clientY}px`);
    } else {
      // 默认：右上角
      root.style.setProperty('--theme-x', `${window.innerWidth - 40}px`);
      root.style.setProperty('--theme-y', '40px');
    }

    // 使用 View Transitions API（如果支持）
    if (supportsViewTransitions()) {
      const transition = document.startViewTransition(() => {
        setThemeState(newTheme);
        applyTheme(newTheme);
      });

      await transition.finished;
    } else {
      // 降级：无动画直接切换
      setThemeState(newTheme);
      applyTheme(newTheme);
    }

    // 保存到 storage
    const settings = await storage.getItem<{ theme: Theme }>(SETTINGS_KEY) || DEFAULT_SETTINGS;
    await storage.setItem(SETTINGS_KEY, { ...settings, theme: newTheme });
  }, []);

  // 循环切换主题: light -> dark -> light（带动画）
  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const nextTheme: Theme = {
      light: 'dark',
      dark: 'light',
    }[theme] as Theme;
    setTheme(nextTheme, event);
  }, [theme, setTheme]);

  // 获取当前实际主题（用于显示图标）
  const getActualTheme = useCallback((): 'light' | 'dark' => {
    return theme;
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    getActualTheme,
    mounted,
  };
}
