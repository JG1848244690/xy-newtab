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

  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(isDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }

  // 保存到 localStorage 缓存
  saveThemeCache(theme);
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

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 设置主题
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    const settings = await storage.getItem<{ theme: Theme }>(SETTINGS_KEY) || DEFAULT_SETTINGS;
    await storage.setItem(SETTINGS_KEY, { ...settings, theme: newTheme });
  }, []);

  // 循环切换主题: light -> dark -> system -> light
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    }[theme] as Theme;
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // 获取当前实际主题（用于显示图标）
  const getActualTheme = useCallback((): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
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
