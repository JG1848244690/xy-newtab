import { useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ArrowLeft, ArrowRight, Ellipsis, Pencil, PinOff, Settings2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { useI18n } from '@/src/i18n';
import type { Shortcut } from '@/src/utils/types';
import { notifyNewtabNavigated } from '@/src/utils/navigationReset';
import { ShortcutIcon } from './ShortcutIcon';

export const dockDropTarget = 'desktop-dock';

interface DockLayoutProps {
  shortcuts: Shortcut[];
  recentPin?: string;
  onUnpin: (id: string) => void;
  onReorder: (id: string, overId: string) => void;
  onManage: () => void;
  onEdit: (shortcut: Shortcut) => void;
}

export function DockLayout({ shortcuts, recentPin, onUnpin, onReorder, onManage, onEdit }: DockLayoutProps) {
  const { t } = useI18n();
  const { setNodeRef, isOver, active } = useDroppable({ id: dockDropTarget });
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerX = useRef<number | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  function updateMagnification() {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const track = trackRef.current;
      if (!track) return;
      const x = pointerX.current === null ? null :
        pointerX.current - track.getBoundingClientRect().left + track.scrollLeft;
      const slots = Array.from(track.children) as HTMLElement[];
      const weights = slots.map((slot) => {
        if (x === null) return 0;
        const distance = Math.abs(x - slot.offsetLeft - slot.offsetWidth / 2);
        return Math.max(0, 1 - (distance / 124) ** 2) ** 2;
      });

      slots.forEach((slot, index) => {
        const weight = weights[index];
        slot.style.setProperty('--dock-scale', (1 + 0.32 * weight).toFixed(3));
        slot.style.setProperty('--dock-lift', (-13 * weight).toFixed(2) + 'px');
        slot.style.zIndex = String(Math.round(weight * 10));
      });
    });
  }

  return (
    <nav aria-label={t('dock.title')} className="dock-position pointer-events-none fixed inset-x-3 z-20 flex justify-center">
      {shortcuts.length ? (
        <div ref={setNodeRef} data-drag-ready={active ? '' : undefined} data-drag-over={isOver ? '' : undefined}
          className="dock-shelf pointer-events-auto min-w-0">
          <div ref={trackRef} className="dock-track relative flex"
            onPointerMove={(event) => {
              if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
              pointerX.current = event.clientX;
              updateMagnification();
            }}
            onPointerLeave={() => {
              pointerX.current = null;
              updateMagnification();
            }}
            onScroll={updateMagnification}>
            {shortcuts.map((shortcut, index) => {
              const previous = shortcuts[index - 1];
              const next = shortcuts[index + 1];
              return (
                <div key={shortcut.id} data-new-pin={shortcut.id === recentPin ? '' : undefined}
                  className="dock-slot group/dock-item relative shrink-0">
                  <a href={shortcut.url} target="_blank" rel="noopener noreferrer" onClick={notifyNewtabNavigated}
                    aria-label={shortcut.name} title={shortcut.name} className="dock-link grid place-items-center">
                    <span className="dock-face grid place-items-center">
                      <ShortcutIcon url={shortcut.url} name={shortcut.name} className="size-8 text-lg" />
                    </span>
                  </a>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t('shortcuts.actionsFor', { name: shortcut.name })}
                        className="bookmark-control dock-control absolute -bottom-1 -right-1 size-6 rounded-md">
                        <Ellipsis className="size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" side="top" sideOffset={12} className="bookmark-menu rounded-xl p-1.5">
                      <DropdownMenuItem onSelect={() => onEdit(shortcut)}>
                        <Pencil className="mr-2 size-4" />{t('common.edit')}
                      </DropdownMenuItem>
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
        </div>
      ) : (
        <Button ref={setNodeRef} variant="ghost" onClick={onManage}
          data-drag-ready={active ? '' : undefined} data-drag-over={isOver ? '' : undefined}
          className="bookmark-surface bookmark-action dock-empty pointer-events-auto max-w-full rounded-2xl px-4 py-3">
          <Settings2 className="size-4" />{t('dock.empty')}
        </Button>
      )}
    </nav>
  );
}
