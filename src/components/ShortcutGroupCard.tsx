import { useState } from 'react';
import { ChevronDown, ChevronRight, Ellipsis, FolderOpen, GripVertical, ListChecks, Move, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/src/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { useI18n } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import type { Shortcut, ShortcutGroup } from '@/src/utils/types';
import { groupDragId, shortcutDragId, ungroupedDragId, type BookmarkDragTarget } from './bookmarkDrag';
import { MigrateDialog } from './MigrateDialog';
import { ShortcutCard } from './ShortcutCard';

const colors: Record<string, string> = {
  blue: '[--bookmark-folder:#5799ed]',
  green: '[--bookmark-folder:#45a579]',
  purple: '[--bookmark-folder:#a584e5]',
  orange: '[--bookmark-folder:#ec9a5a]',
  red: '[--bookmark-folder:#e87d8a]',
  cyan: '[--bookmark-folder:#53bdc9]',
};

interface ShortcutGroupCardProps {
  group: ShortcutGroup | null;
  groups: ShortcutGroup[];
  shortcuts: Shortcut[];
  pinnedIds: ReadonlySet<string>;
  onSetPinned: (shortcutId: string, pinned: boolean) => void;
  onToggleExpand?: () => void;
  onEditGroup?: () => void;
  onRemoveGroup?: () => void;
  onAddShortcut: () => void;
  onEditShortcut: (shortcut: Shortcut) => void;
  onDeleteShortcuts: (ids: string[]) => void;
  onMoveShortcuts: (ids: string[], targetId: string | null) => void;
  onCopyShortcuts: (ids: string[], targetId: string | null) => void;
}

interface TileProps {
  shortcut: Shortcut;
  sectionId: string | null;
  pinned: boolean;
  onSetPinned: (pinned: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
  onSelect?: () => void;
  selected: boolean;
}

function BookmarkTile({ shortcut, sectionId, onSelect, ...props }: TileProps) {
  const { t } = useI18n();
  const { active } = useDndContext();
  const isSameSection = active?.data.current?.kind === 'shortcut' && active.data.current.groupId === sectionId;
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging, isOver } = useSortable({
    id: shortcutDragId(sectionId, shortcut.id),
    data: { kind: 'shortcut', groupId: sectionId, shortcutId: shortcut.id } satisfies BookmarkDragTarget,
    disabled: { draggable: Boolean(onSelect), droppable: false },
  });

  return (
    <div ref={setNodeRef} className={cn('group/tile relative min-w-0 rounded-xl', isDragging && 'opacity-40',
      isOver && !isDragging && active?.data.current?.kind === 'shortcut' && 'ring-2 ring-primary')}
      style={isSameSection ? { transform: CSS.Transform.toString(transform), transition } : undefined}>
      <ShortcutCard shortcut={shortcut} onSelect={onSelect} {...props} />
      {!onSelect && (
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
          aria-label={t('shortcuts.drag', { name: shortcut.name })}
          className="bookmark-control absolute left-1 top-1 grid size-7 touch-none place-items-center rounded-lg cursor-grab transition-opacity active:cursor-grabbing [@media(hover:hover)_and_(pointer:fine)]:opacity-0 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100">
          <GripVertical className="size-4" />
        </button>
      )}
    </div>
  );
}

export function ShortcutGroupCard(props: ShortcutGroupCardProps) {
  return props.group ? <SortableGroup {...props} group={props.group} /> : <UngroupedSection {...props} />;
}

function SortableGroup(props: ShortcutGroupCardProps & { group: ShortcutGroup }) {
  const { t } = useI18n();
  const { active } = useDndContext();
  const { group } = props;
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: groupDragId(group.id),
    data: { kind: 'group', groupId: group.id } satisfies BookmarkDragTarget,
  });
  return (
    <div ref={setNodeRef} className={cn(isDragging && 'relative z-20 opacity-80')}
      style={active?.data.current?.kind === 'group' ? { transform: CSS.Transform.toString(transform), transition } : undefined}>
      <BookmarkSection {...props} dragHandle={
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
          aria-label={t('groups.drag', { name: group.name })}
          className="bookmark-action grid size-8 shrink-0 touch-none place-items-center rounded-lg cursor-grab active:cursor-grabbing">
          <GripVertical className="size-4" />
        </button>
      } />
    </div>
  );
}

function UngroupedSection(props: ShortcutGroupCardProps) {
  const { setNodeRef } = useDroppable({
    id: ungroupedDragId,
    data: { kind: 'ungrouped', groupId: null } satisfies BookmarkDragTarget,
  });
  return <div ref={setNodeRef}><BookmarkSection {...props} /></div>;
}

function BookmarkSection({
  group, groups, shortcuts, pinnedIds, onSetPinned, onToggleExpand, onEditGroup,
  onRemoveGroup, onAddShortcut, onEditShortcut, onDeleteShortcuts, onMoveShortcuts,
  onCopyShortcuts, dragHandle,
}: ShortcutGroupCardProps & { dragHandle?: React.ReactNode }) {
  const { t } = useI18n();
  const { active, over } = useDndContext();
  const [selection, setSelection] = useState<Set<string> | null>(null);
  const [migrating, setMigrating] = useState(false);
  const sectionId = group?.id ?? null;
  const label = group?.name ?? t('groups.ungrouped');
  const ids = shortcuts.map(({ id }) => id);
  const selected = ids.filter((id) => selection?.has(id));
  const allSelected = ids.length > 0 && selected.length === ids.length;
  const expanded = group?.isExpanded ?? true;
  const activeShortcut = active?.data.current?.kind === 'shortcut';
  const target = activeShortcut && over?.data.current?.groupId === sectionId && active?.data.current?.groupId !== sectionId;

  function toggleSelection(id: string) {
    setSelection((current) => {
      const next = new Set(current ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applySelection(action: (ids: string[]) => void) {
    if (selected.length) action(selected);
    setSelection(null);
  }

  return (
    <section aria-label={label} className={cn('bookmark-surface rounded-2xl',
      group && colors[group.color ?? ''], target && 'bookmark-drop-target')}>
      <header data-open={expanded} className={cn('bookmark-header sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5',
        expanded ? 'rounded-t-2xl' : 'rounded-2xl')}>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {dragHandle}
          {group ? (
            <button type="button" onClick={onToggleExpand} aria-expanded={expanded}
              className="bookmark-action flex min-h-8 min-w-0 items-center gap-2 rounded-lg px-1.5 text-left">
              {expanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
              <FolderOpen className="bookmark-folder size-[18px] shrink-0" />
              <span title={label} className="truncate text-sm font-semibold">{label}</span>
              <span className="bookmark-muted shrink-0 text-xs tabular-nums">({ids.length})</span>
            </button>
          ) : (
            <h2 className="px-2 text-sm font-semibold">{label} <span className="bookmark-muted text-xs tabular-nums">({ids.length})</span></h2>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {selection ? (
            <>
              <Button variant="outline" size="sm" aria-pressed={allSelected}
                onClick={() => setSelection(new Set(allSelected ? [] : ids))}>
                {t(allSelected ? 'common.deselectAll' : 'common.selectAll')}
              </Button>
              <Button variant="outline" size="sm" disabled={!selected.length} onClick={() => setMigrating(true)}>
                <Move className="size-4" />{t('common.migrate')}
              </Button>
              <Button variant="destructive" size="sm" disabled={!selected.length} onClick={() => applySelection(onDeleteShortcuts)}>
                <Trash2 className="size-4" />{t('common.delete')}
              </Button>
              <Button variant="ghost" size="icon" className="bookmark-action rounded-lg" aria-label={t('common.cancel')} onClick={() => setSelection(null)}>
                <X className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="bookmark-action rounded-lg" aria-label={t('common.batchManage')} disabled={!ids.length} onClick={() => {
                if (!expanded) onToggleExpand?.();
                setSelection(new Set());
              }}>
                <ListChecks className="size-4 sm:hidden" />
                <span className="hidden sm:inline">{t('common.batchManage')}</span>
              </Button>
              {expanded && (
                <Button variant="ghost" size="icon" className="bookmark-action rounded-lg" aria-label={t('groups.addShortcut')} onClick={onAddShortcut}>
                  <Plus className="size-4" />
                </Button>
              )}
              {group && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="bookmark-action rounded-lg" aria-label={t('groups.actionsFor', { name: label })}><Ellipsis className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bookmark-menu rounded-xl p-1.5">
                    <DropdownMenuItem onSelect={onEditGroup}><Pencil className="mr-2 size-4" />{t('groups.editGroup')}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={onRemoveGroup} data-variant="destructive">
                      <Trash2 className="mr-2 size-4" />{t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </header>

      {selection && selected.length > 0 && (
        <p className="bookmark-muted px-4 pt-2 text-xs">{t('common.selectedCount', { n: selected.length })}</p>
      )}

      {expanded && (shortcuts.length ? (
        <SortableContext items={ids.map((id) => shortcutDragId(sectionId, id))} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,6.5rem),1fr))] gap-1 p-2 sm:gap-1.5 sm:p-3">
            {shortcuts.map((shortcut) => (
              <BookmarkTile key={shortcut.id} shortcut={shortcut} sectionId={sectionId}
                pinned={pinnedIds.has(shortcut.id)} onSetPinned={(pinned) => onSetPinned(shortcut.id, pinned)}
                onEdit={() => onEditShortcut(shortcut)} onRemove={() => onDeleteShortcuts([shortcut.id])}
                selected={selection?.has(shortcut.id) ?? false}
                onSelect={selection ? () => toggleSelection(shortcut.id) : undefined} />
            ))}
          </div>
        </SortableContext>
      ) : (
        <p className="bookmark-muted px-4 py-4 text-center text-sm">{t(group ? 'groups.empty' : 'shortcuts.noShortcuts')}</p>
      ))}

      <MigrateDialog open={migrating} onOpenChange={setMigrating} groups={groups}
        currentGroupId={sectionId} selectedCount={selected.length}
        onMigrate={(targetId) => applySelection((ids) => onMoveShortcuts(ids, targetId))}
        onCopy={(targetId) => applySelection((ids) => onCopyShortcuts(ids, targetId))} />
    </section>
  );
}
