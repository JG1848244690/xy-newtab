import { useState, useEffect } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import type { Shortcut } from '@/src/utils/types';
import { getFaviconWithFallback, generateInitialFallback } from '@/src/utils/faviconCache';
import { cn } from '@/src/lib/utils';

interface ShortcutCardProps {
  shortcut: Shortcut;
  onEdit: (shortcut: Shortcut) => void;
  onRemove: (id: string) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ShortcutCard({
  shortcut,
  onEdit,
  onRemove,
  isSelectMode = false,
  isSelected = false,
  onSelect
}: ShortcutCardProps) {
  const [faviconSrc, setFaviconSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFavicon = async () => {
      setIsLoading(true);

      try {
        // 三级 fallback: 网络 → IndexedDB → 首字母
        const { src } = await getFaviconWithFallback(shortcut.url, shortcut.name);

        if (isMounted) {
          setFaviconSrc(src);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setFaviconSrc(generateInitialFallback(shortcut.name));
          setIsLoading(false);
        }
      }
    };

    loadFavicon();

    return () => {
      isMounted = false;
    };
  }, [shortcut.url, shortcut.name]);

  const handleClick = () => {
    if (isSelectMode) {
      onSelect?.();
    } else {
      window.open(shortcut.url, '_blank');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 group relative h-25",
        "bg-white/60 dark:bg-card/60 backdrop-blur-md",
        "border border-white/40 dark:border-border/50",
        "hover:bg-white/80 dark:hover:bg-card/80",
        "hover:border-primary/30 dark:hover:border-primary/30",
        "hover:shadow-lg hover:shadow-primary/5",
        "hover:-translate-y-1 hover:scale-[1.02]",
        "active:scale-[0.98]",
        isSelectMode && isSelected && "ring-2 ring-primary border-primary bg-primary/10"
      )}
    >
      {/* 选择模式下隐藏操作菜单 */}
      {!isSelectMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs">⋯</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onEdit(shortcut);
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRemove(shortcut.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 图标 */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all",
        "bg-linear-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20",
        isSelectMode && isSelected && "ring-1 ring-primary"
      )}>
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        ) : faviconSrc ? (
          <img
            src={faviconSrc}
            alt={shortcut.name}
            className="w-8 h-8 rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-lg font-bold text-primary">${shortcut.name.charAt(0).toUpperCase()}</span>`;
              }
            }}
          />
        ) : (
          <span className="text-lg font-bold text-primary">
            {shortcut.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* 名称 */}
      <span className={cn(
        "mt-2 text-xs truncate max-w-full text-center",
        isSelectMode && isSelected ? "text-primary font-medium" : "text-card-foreground"
      )}>
        {shortcut.name}
      </span>
    </div>
  );
}
