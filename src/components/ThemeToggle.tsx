import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import type { Theme } from '@/src/utils/types';
import { cn } from '@/src/lib/utils';

interface ThemeToggleProps {
  theme: Theme;
  onThemeChange: (theme: Theme, event?: React.MouseEvent) => void;
}

const themeConfig = {
  light: { icon: Sun, label: '浅色' },
  dark: { icon: Moon, label: '深色' },
  system: { icon: Monitor, label: '跟随系统' },
};

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const CurrentIcon = themeConfig[theme].icon;

  // 获取按钮中心位置并创建模拟事件
  const handleClick = (t: Theme, event: React.MouseEvent) => {
    // 使用点击位置作为扩散起点
    onThemeChange(t, event);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <CurrentIcon className="h-5 w-5" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(themeConfig) as Theme[]).map((t) => {
          const Icon = themeConfig[t].icon;
          return (
            <DropdownMenuItem
              key={t}
              onClick={(e) => handleClick(t, e as unknown as React.MouseEvent)}
              className={cn(theme === t && "bg-accent")}
            >
              <Icon className="mr-2 h-4 w-4" />
              {themeConfig[t].label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
