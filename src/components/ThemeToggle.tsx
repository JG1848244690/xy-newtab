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
  onThemeChange: (theme: Theme) => void;
}

const themeConfig = {
  light: { icon: Sun, label: '浅色' },
  dark: { icon: Moon, label: '深色' },
  system: { icon: Monitor, label: '跟随系统' },
};

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const CurrentIcon = themeConfig[theme].icon;

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
              onClick={() => onThemeChange(t)}
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
