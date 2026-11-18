import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookmarkPlus, ChevronDown, Plus, Search, Settings, X } from 'lucide-react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useShortcutsStore } from '@/src/hooks/useShortcutsStore';
import { useGroupsStore } from '@/src/hooks/useGroupsStore';
import { useI18n } from '@/src/i18n';
import { BOOKMARK_FILTER_DELAY_MS } from '@/src/utils/constants';
import { filterShortcuts } from '@/src/services/shortcuts';
import { importChromeBookmarks } from '@/src/services/chromeBookmarks';
import type { Shortcut, ShortcutGroup } from '@/src/utils/types';
import { bookmarkCollision, bookmarkKeyboardCoordinates, groupDragId, type BookmarkDragTarget } from './bookmarkDrag';
import { GroupDialog } from './GroupDialog';
import { ShortcutDialog } from './ShortcutDialog';
import { ShortcutGroupCard } from './ShortcutGroupCard';
import { ShortcutIcon } from './ShortcutIcon';

type ShortcutEditor = { shortcut: Shortcut } | { groupId: string | null };
type ImportStatus = { type: 'pending' } | { type: 'success'; count: number } | { type: 'error'; message?: string };

export function GroupLayout() {
  const { t } = useI18n();
  const { shortcuts, actions: shortcutActions } = useShortcutsStore();
  const { groups, pinnedIds, actions } = useGroupsStore();
  const [groupEditor, setGroupEditor] = useState<ShortcutGroup | 'new' | null>(null);
  const [shortcutEditor, setShortcutEditor] = useState<ShortcutEditor | null>(null);
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState<Shortcut | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const search = useDebounce(query, BOOKMARK_FILTER_DELAY_MS).trim();
  const pins = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const byId = useMemo(() => new Map(shortcuts.map((shortcut) => [shortcut.id, shortcut])), [shortcuts]);
  const board = useMemo(() => {
    const matches = new Set(filterShortcuts(shortcuts, search).map(({ id }) => id));
    const groupedIds = new Set(groups.flatMap(({ shortcutIds }) => shortcutIds));
    const sections = groups.map((group) => ({
      group,
      shortcuts: group.shortcutIds.flatMap((id) => {
        const item = byId.get(id);
        return item && matches.has(id) ? [item] : [];
      }),
    })).filter((section) => !search || section.shortcuts.length);
    const ungrouped = shortcuts.filter(({ id }) => !groupedIds.has(id) && matches.has(id));
    return { sections, ungrouped, count: matches.size };
  }, [byId, groups, shortcuts, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: bookmarkKeyboardCoordinates }),
  );

  function dragLabel(target?: BookmarkDragTarget): string {
    if (target?.kind === 'shortcut') return byId.get(target.shortcutId)?.name ?? '';
    if (target?.kind === 'group') return groups.find(({ id }) => id === target.groupId)?.name ?? '';
    return t('groups.ungrouped');
  }

  useEffect(() => {
    if (!importStatus || importStatus.type === 'pending') return;
    const timer = setTimeout(() => setImportStatus(null), 3000);
    return () => clearTimeout(timer);
  }, [importStatus]);

  function handleDragStart({ active }: DragStartEvent) {
    const source = active.data.current as BookmarkDragTarget | undefined;
    if (source?.kind === 'shortcut') setDragging(byId.get(source.shortcutId) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    if (!over || active.id === over.id) return;
    const source = active.data.current as BookmarkDragTarget | undefined;
    const target = over.data.current as BookmarkDragTarget | undefined;
    if (!source || !target) return;

    if (source.kind === 'group') {
      if (target.kind === 'group') actions.reorder(source.groupId, target.groupId);
      return;
    }
    if (source.kind !== 'shortcut') return;

    if (source.groupId !== target.groupId) {
      actions.move([source.shortcutId], source.groupId, target.groupId,
        target.kind === 'shortcut' ? target.shortcutId : undefined);
    } else if (target.kind === 'shortcut') {
      if (source.groupId === null) shortcutActions.reorder(source.shortcutId, target.shortcutId);
      else actions.reorderShortcuts(source.groupId, source.shortcutId, target.shortcutId);
    }
  }

  function handleSaveShortcut(data: { name: string; url: string; icon?: string }) {
    if (!shortcutEditor) return;
    if ('shortcut' in shortcutEditor) {
      shortcutActions.update(shortcutEditor.shortcut.id, data);
    } else {
      const shortcut = shortcutActions.add(data);
      if (shortcutEditor.groupId) actions.addShortcut(shortcutEditor.groupId, shortcut.id);
    }
  }

  async function handleImportChromeBookmarks() {
    setImportStatus({ type: 'pending' });
    try {
      const { added } = await importChromeBookmarks(shortcutActions.addMany);
      setImportStatus({ type: 'success', count: added });
    } catch (error) {
      setImportStatus({ type: 'error', message: error instanceof Error ? error.message : undefined });
    }
  }

  function renderSection(group: ShortcutGroup | null, items: Shortcut[]) {
    const groupId = group?.id ?? null;
    return (
      <ShortcutGroupCard key={groupId ? groupDragId(groupId) : 'ungrouped'} group={group} shortcuts={items}
        groups={groups} pinnedIds={pins} onSetPinned={actions.setPinned}
        onToggleExpand={group ? () => actions.toggleExpand(group.id) : undefined}
        onEditGroup={group ? () => setGroupEditor(group) : undefined}
        onRemoveGroup={group ? () => actions.remove(group.id) : undefined}
        onAddShortcut={() => setShortcutEditor({ groupId })}
        onEditShortcut={(shortcut) => setShortcutEditor({ shortcut })}
        onDeleteShortcuts={shortcutActions.removeMany}
        onMoveShortcuts={(ids, targetId) => actions.move(ids, groupId, targetId)}
        onCopyShortcuts={(ids, targetId) => {
          if (targetId) actions.copy(ids, targetId);
          else {
            for (const id of ids) {
              const shortcut = byId.get(id);
              if (shortcut) shortcutActions.add(shortcut);
            }
          }
        }} />
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="bookmark-muted pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2" />
          <Input type="search" aria-label={t('shortcuts.searchPlaceholder')} placeholder={t('shortcuts.searchPlaceholder')}
            value={query} onChange={(event) => setQuery(event.target.value)} className="bookmark-surface bookmark-input h-10 rounded-xl pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden" />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('shortcuts.clearSearch')}
              className="bookmark-action absolute right-2 top-1/2 z-10 grid size-6 -translate-y-1/2 place-items-center rounded-lg">
              <X className="size-4" />
            </button>
          )}
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bookmark-surface bookmark-action h-10 shrink-0 rounded-xl px-3.5">
              <Settings className="size-4" />{t('layout.actions')}<ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bookmark-menu rounded-xl p-1.5">
            <DropdownMenuItem disabled={importStatus?.type === 'pending'} onSelect={handleImportChromeBookmarks}>
              <BookmarkPlus className="mr-2 size-4" />{t('importExport.importGoogleBookmarks')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setGroupEditor('new')}>
              <Plus className="mr-2 size-4" />{t('groups.newGroup')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {importStatus && (
        <p role="status" className="bookmark-surface w-fit rounded-lg px-3 py-1.5 text-sm">
          {importStatus.type === 'pending' ? t('importExport.importGoogleBookmarksPending')
            : importStatus.type === 'success' ? t('importExport.importGoogleBookmarksSuccess', { n: importStatus.count })
              : importStatus.message || t('importExport.importGoogleBookmarksFail')}
        </p>
      )}
      {search && (
        <p role="status" className="bookmark-surface w-fit rounded-lg px-3 py-1.5 text-sm">
          {board.count ? t('common.foundResults', { n: board.count }) : t('common.noResults')}
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={bookmarkCollision}
        accessibility={{
          screenReaderInstructions: { draggable: t('groups.dragHelp') },
          announcements: {
            onDragStart: ({ active }) => t('groups.dragPicked', { name: dragLabel(active.data.current as BookmarkDragTarget) }),
            onDragOver: ({ over }) => over ? t('groups.dragOver', { name: dragLabel(over.data.current as BookmarkDragTarget) }) : '',
            onDragEnd: ({ over }) => over ? t('groups.dragDropped', { name: dragLabel(over.data.current as BookmarkDragTarget) }) : t('groups.dragCancelled'),
            onDragCancel: () => t('groups.dragCancelled'),
          },
        }}
        onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setDragging(null)}>
        <SortableContext items={board.sections.map(({ group }) => groupDragId(group.id))} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {board.sections.map(({ group, shortcuts }) => renderSection(group, shortcuts))}
            {(!search || board.ungrouped.length > 0 || dragging) && renderSection(null, board.ungrouped)}
          </div>
        </SortableContext>
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {dragging && (
              <div className="bookmark-surface grid min-h-24 min-w-0 justify-items-center gap-2 rounded-xl px-2 py-2.5 text-center text-sm font-medium">
                <div className="bookmark-icon">
                  <ShortcutIcon url={dragging.url} name={dragging.name} className="size-8 text-xl" />
                </div>
                <span className="bookmark-title line-clamp-2 leading-[1.25]">{dragging.name}</span>
              </div>
            )}
          </DragOverlay>, document.body,
        )}
      </DndContext>

      <GroupDialog open={groupEditor !== null} onOpenChange={(open) => { if (!open) setGroupEditor(null); }}
        group={groupEditor === 'new' ? null : groupEditor}
        onSave={(data) => {
          if (groupEditor && groupEditor !== 'new') actions.update(groupEditor.id, data);
          else actions.add(data);
        }} />
      <ShortcutDialog open={shortcutEditor !== null} onOpenChange={(open) => { if (!open) setShortcutEditor(null); }}
        shortcut={shortcutEditor && 'shortcut' in shortcutEditor ? shortcutEditor.shortcut : null}
        quickMode={shortcutEditor !== null && 'groupId' in shortcutEditor} onSave={handleSaveShortcut} />
    </div>
  );
}
