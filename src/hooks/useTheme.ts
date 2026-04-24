import { useState, useEffect } from 'react';

/**
 * 主题切换 Hook - 仅支持暗色主题
 */
export function useTheme() {
  const [theme] = useState<'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 应用暗色主题到 DOM
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    setMounted(true);
  }, []);

  return {
    theme,
    setTheme: () => {}, // 空函数，不支持切换
    toggleTheme: () => {}, // 空函数，不支持切换
    getActualTheme: () => 'dark' as const,
    mounted,
  };
}
