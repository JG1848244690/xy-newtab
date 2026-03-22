import { Sun, Moon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useRef } from 'react';
import type { Theme } from '@/src/utils/types';

interface ThemeToggleProps {
  theme: Theme;
  onThemeChange: (theme: Theme, event?: React.MouseEvent) => void;
}

const themeConfig = {
  light: { icon: Sun, label: '浅色' },
  dark: { icon: Moon, label: '深色' },
};

// 循环顺序
const themeOrder: Theme[] = ['light', 'dark'];

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const fakeEvent = {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      } as React.MouseEvent;
      onThemeChange(nextTheme, fakeEvent);
    } else {
      onThemeChange(nextTheme);
    }
  };

  const CurrentIcon = themeConfig[theme].icon;

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={handleClick}
      title={`当前: ${themeConfig[theme].label} (点击切换)`}
    >
      <CurrentIcon className="h-5 w-5" />
      <span className="sr-only">切换主题</span>
    </Button>
  );
}
