import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import type { Shortcut } from '@/src/utils/types';
import { getFaviconUrl } from '@/src/utils/favicon';
import { cn } from '@/src/lib/utils';

interface ShortcutCardProps {
  shortcut: Shortcut;
  onEdit: (shortcut: Shortcut) => void;
  onRemove: (id: string) => void;
}

export function ShortcutCard({ shortcut, onEdit, onRemove }: ShortcutCardProps) {
  const handleClick = () => {
    window.open(shortcut.url, '_blank');
  };

  const faviconUrl = shortcut.icon || getFaviconUrl(shortcut.url);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all group relative",
        "bg-card hover:bg-accent border border-border hover:border-primary/50",
        "shadow-sm hover:shadow-md"
      )}
    >
      {/* 操作菜单 */}
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

      {/* 图标 */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center shadow-sm group-hover:shadow transition-all">
        <img
          src={faviconUrl}
          alt={shortcut.name}
          className="w-8 h-8 rounded-lg"
          onError={(e) => {
            // 如果 favicon 加载失败，显示首字母
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-lg font-bold text-primary">${shortcut.name.charAt(0).toUpperCase()}</span>`;
            }
          }}
        />
      </div>

      {/* 名称 */}
      <span className="mt-2 text-xs text-card-foreground group-hover:text-primary transition-colors truncate max-w-full text-center">
        {shortcut.name}
      </span>
    </div>
  );
}
