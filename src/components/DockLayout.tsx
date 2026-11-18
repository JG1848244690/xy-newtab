import { useState } from 'react';
import { ArrowLeft, ArrowRight, Ellipsis, PinOff } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { useI18n } from '@/src/i18n';
import type { Shortcut } from '@/src/utils/types';
import { notifyNewtabNavigated } from '@/src/utils/navigationReset';
import { ShortcutIcon } from './ShortcutIcon';

interface DockLayoutProps {
  shortcuts: Shortcut[];
  onUnpin: (id: string) => void;
  onReorder: (id: string, overId: string) => void;
}

export function DockLayout({ shortcuts, onUnpin, onReorder }: DockLayoutProps) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredIndex = hovered === null ? -1 : shortcuts.findIndex(({ id }) => id === hovered);

  return (
    <nav aria-label={t('dock.title')} className="pointer-events-none fixed inset-x-3 bottom-10 z-20 flex justify-center">
      {shortcuts.length ? (
        <div onPointerLeave={() => setHovered(null)}
          className="bookmark-surface pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-2xl px-3 pb-2 pt-3">
          {shortcuts.map((shortcut, index) => {
            const previous = shortcuts[index - 1];
            const next = shortcuts[index + 1];
            const distance = hoveredIndex < 0 ? Infinity : Math.abs(hoveredIndex - index);
            const scale = distance === 0 ? 1.16 : distance === 1 ? 1.06 : 1;
            return (
              <div key={shortcut.id} onPointerEnter={() => setHovered(shortcut.id)}
                className="group/dock-item relative shrink-0">
                <a href={shortcut.url} target="_blank" rel="noopener noreferrer" onClick={notifyNewtabNavigated}
                  aria-label={shortcut.name} title={shortcut.name}
                  style={{ transform: 'scale(' + scale + ')' }}
                  className="bookmark-icon bookmark-tile transition-transform motion-reduce:transition-none">
                  <ShortcutIcon url={shortcut.url} name={shortcut.name} className="size-8 text-xl" />
                </a>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t('shortcuts.actionsFor', { name: shortcut.name })}
                      className="bookmark-control absolute -right-1 -top-1 size-6 rounded-md transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 group-hover/dock-item:opacity-100 group-focus-within/dock-item:opacity-100 data-[state=open]:opacity-100">
                      <Ellipsis className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bookmark-menu rounded-xl p-1.5">
                    <DropdownMenuItem disabled={!previous} onSelect={() => previous && onReorder(shortcut.id, previous.id)}>
                      <ArrowLeft className="mr-2 size-4" />{t('dock.moveLeft')}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!next} onSelect={() => next && onReorder(shortcut.id, next.id)}>
                      <ArrowRight className="mr-2 size-4" />{t('dock.moveRight')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onUnpin(shortcut.id)}>
                      <PinOff className="mr-2 size-4" />{t('dock.unpin')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="bookmark-surface pointer-events-auto rounded-xl px-4 py-3 text-sm">
          {t('dock.empty')}
        </p>
      )}
    </nav>
  );
}
