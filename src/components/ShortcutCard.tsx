import { Ellipsis, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { ShortcutIcon } from './ShortcutIcon';
import type { Shortcut } from '@/src/utils/types';
import { notifyNewtabNavigated } from '@/src/utils/navigationReset';
import { useI18n } from '@/src/i18n';

interface ShortcutCardProps {
  shortcut: Shortcut;
  onEdit: () => void;
  onRemove: () => void;
  pinned: boolean;
  onSetPinned: (pinned: boolean) => void;
  selected?: boolean;
  onSelect?: () => void;
}

export function ShortcutCard({ shortcut, onEdit, onRemove, pinned, onSetPinned, selected, onSelect }: ShortcutCardProps) {
  const { t } = useI18n();
  const content = (
    <>
      <span className="bookmark-icon">
        <ShortcutIcon url={shortcut.url} name={shortcut.name} className="size-8 text-xl" />
      </span>
      <span className="bookmark-title line-clamp-2 text-center text-sm font-medium leading-[1.25]">
        {shortcut.name}
      </span>
    </>
  );
  const cardClass = 'bookmark-tile grid h-full min-h-24 w-full min-w-0 auto-rows-max justify-items-center gap-2 rounded-xl px-2 py-2.5';

  return (
    <div className="relative h-full" title={shortcut.name + '\n' + shortcut.url}>
      {onSelect ? (
        <button type="button" aria-pressed={selected} onClick={onSelect} className={cardClass}>
          {content}
        </button>
      ) : (
        <>
          <a href={shortcut.url} target="_blank" rel="noopener noreferrer"
            onClick={notifyNewtabNavigated} draggable={false} className={cardClass}>
            {content}
          </a>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label={t('shortcuts.actionsFor', { name: shortcut.name })}
                className="bookmark-control absolute right-1 top-1 size-7 rounded-lg transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 data-[state=open]:opacity-100">
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bookmark-menu min-w-36 rounded-xl p-1.5">
              <DropdownMenuItem onSelect={() => onSetPinned(!pinned)}>
                {pinned ? <PinOff className="mr-2 size-4" /> : <Pin className="mr-2 size-4" />}
                {t(pinned ? 'dock.unpin' : 'dock.pin')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="mr-2 size-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onRemove} data-variant="destructive">
                <Trash2 className="mr-2 size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
