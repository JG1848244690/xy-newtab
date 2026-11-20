import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DndContext, DragOverlay, KeyboardCode, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { DockLayout, dockDropTarget } from './DockLayout';
import { DesktopPages, DesktopShortcutFace } from './DesktopPages';
import { desktopCollision, desktopKeyboardCoordinates, type DesktopDrop } from './desktopDrag';
import { ShortcutDialog } from './ShortcutDialog';
import type { Shortcut } from '@/src/utils/types';
import { useI18n } from '@/src/i18n';

interface DockDesktopProps {
  shortcuts: Shortcut[];
  dockShortcuts: Shortcut[];
  desktopOrder?: string[];
  hiddenIds?: string[];
  onSetDesktopVisible: (id: string, visible: boolean) => void;
  onSort: (ids: string[]) => void;
  onUpdateShortcut: (id: string, data: { name: string; url: string }) => void;
  onPin: (id: string, pinned: boolean) => void;
  onReorder: (id: string, overId: string) => void;
  onManage: () => void;
}

function taskbarInset(): number {
  const { screen, outerHeight, outerWidth, innerWidth, screenY } = window;
  if (!navigator.userAgent.includes('Windows') || outerHeight < screen.height - 2) return 0;

  const reservedHeight = Math.max(0, screen.height - screen.availHeight);
  const { availTop } = screen as Screen & { availTop?: number };
  const overlap = availTop === undefined ? reservedHeight : screenY + outerHeight - availTop - screen.availHeight;
  // An auto-hide taskbar can cover a screen-filling window without shrinking its work area.
  const bottomInset = reservedHeight ? Math.max(0, Math.min(reservedHeight, overlap)) : 48;
  // Screen bounds ignore page zoom. Keep the clearance large enough when zooming out.
  const viewportScale = Math.max(1, innerWidth / Math.max(1, Math.min(outerWidth, screen.width)));
  return Math.ceil(bottomInset * viewportScale);
}

export function DockDesktop({ shortcuts, dockShortcuts, desktopOrder, hiddenIds, onSetDesktopVisible,
  onSort, onUpdateShortcut, onPin, onReorder, onManage }: DockDesktopProps) {
  const { t } = useI18n();
  const [dragged, setDragged] = useState<Shortcut | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [recentPin, setRecentPin] = useState<string>();
  const [editing, setEditing] = useState<Shortcut | null>(null);
  const editorTrigger = useRef<HTMLButtonElement | null>(null);
  const workspace = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = workspace.current;
    if (!surface) return;
    const updateInset = () => surface.style.setProperty('--dock-taskbar-inset', `${taskbarInset()}px`);
    updateInset();
    window.addEventListener('resize', updateInset);
    window.addEventListener('focus', updateInset);
    document.addEventListener('fullscreenchange', updateInset);
    return () => {
      window.removeEventListener('resize', updateInset);
      window.removeEventListener('focus', updateInset);
      document.removeEventListener('fullscreenchange', updateInset);
    };
  }, []);
  const ordered = useMemo(() => {
    if (!desktopOrder?.length) return shortcuts;
    const remaining = new Map(shortcuts.map((shortcut) => [shortcut.id, shortcut]));
    const orderedShortcuts = desktopOrder.flatMap((id) => {
      const shortcut = remaining.get(id);
      if (!shortcut) return [];
      remaining.delete(id);
      return [shortcut];
    });
    return [...orderedShortcuts, ...remaining.values()];
  }, [desktopOrder, shortcuts]);
  const hidden = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const visible = useMemo(() => ordered.filter(({ id }) => !hidden.has(id)), [hidden, ordered]);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 240, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: desktopKeyboardCoordinates, scrollBehavior: 'auto',
      keyboardCodes: { start: [KeyboardCode.Space], end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab], cancel: [KeyboardCode.Esc] },
    }),
  );

  function pin(shortcut: Shortcut, pinned: boolean) {
    onPin(shortcut.id, pinned);
    setRecentPin(pinned ? shortcut.id : undefined);
    setAnnouncement(t(pinned ? 'desktop.pinned' : 'desktop.unpinned', { name: shortcut.name }));
  }

  function edit(shortcut: Shortcut, trigger?: HTMLButtonElement) {
    editorTrigger.current = trigger ?? null;
    setEditing(shortcut);
  }

  function moveShortcut(shortcut: Shortcut, index: number, page: number) {
    const ids = visible.map(({ id }) => id);
    const from = ids.indexOf(shortcut.id);
    if (from < 0 || index < 0 || index >= ids.length || from === index) return false;
    const next = arrayMove(ids, from, index);
    let cursor = 0;
    onSort(ordered.map(({ id }) => hidden.has(id) ? id : next[cursor++]));
    setAnnouncement(t('desktop.moved', { name: shortcut.name, n: page + 1 }));
    return true;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={desktopCollision} autoScroll={false}
      accessibility={{
        screenReaderInstructions: { draggable: t('desktop.dragInstructions') },
        announcements: {
          onDragStart: ({ active }) => t('groups.dragPicked', { name: active.data.current?.shortcut?.name ?? '' }),
          onDragOver: ({ over }) => {
            if (!over) return;
            const target = over.data.current as DesktopDrop | undefined;
            const name = target?.kind === 'shortcut' ? target.shortcut.name
              : target ? t('desktop.pageTarget', { n: target.page + 1 }) : t('dock.title');
            return t('groups.dragOver', { name });
          },
          onDragEnd: ({ over }) => over ? '' : t('groups.dragCancelled'),
          onDragCancel: () => t('groups.dragCancelled'),
        },
      }}
      onDragStart={({ active }) => {
        setAnnouncement('');
        setDragged(active.data.current?.shortcut ?? null);
      }}
      onDragCancel={() => setDragged(null)}
      onDragEnd={({ active, over }) => {
        const shortcut = active.data.current?.shortcut as Shortcut | undefined;
        setDragged(null);
        if (!shortcut || !over) return;
        if (over.id === dockDropTarget) {
          pin(shortcut, true);
          return;
        }
        const target = over.data.current as DesktopDrop | undefined;
        if (!target) return;
        moveShortcut(shortcut, target.index, target.page);
        if (target.kind === 'marker') target.showPage();
      }}>
      <div ref={workspace}>
        <DesktopPages shortcuts={visible} onEdit={edit} onMove={moveShortcut} />
        <DockLayout shortcuts={dockShortcuts} recentPin={recentPin} onUnpin={(id) => onPin(id, false)}
          onReorder={onReorder} onManage={onManage} onEdit={edit} />
      </div>
      <ShortcutDialog open={editing !== null} shortcut={editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        onSave={(data) => { if (editing) onUpdateShortcut(editing.id, data); }}
        onCloseAutoFocus={(event) => {
          const trigger = editorTrigger.current?.isConnected ? editorTrigger.current : document.getElementById('desktop-bookmark-search');
          if (!trigger) return;
          event.preventDefault();
          trigger.focus({ preventScroll: true });
        }}
        desktopVisibility={editing ? { visible: !hidden.has(editing.id), onChange: (show) => onSetDesktopVisible(editing.id, show) } : undefined}
        dockPin={editing ? { pinned: dockShortcuts.some(({ id }) => id === editing.id), onSave: (pinned) => pin(editing, pinned) } : undefined} />
      <DragOverlay dropAnimation={null} zIndex={40}>
        {dragged && <div className="desktop-drag-preview" aria-hidden="true"><DesktopShortcutFace shortcut={dragged} /></div>}
      </DragOverlay>
      <p className="sr-only" role="status">{announcement}</p>
    </DndContext>
  );
}
