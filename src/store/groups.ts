import { createStore } from '@/src/lib/store';
import { createStorageCell } from '@/src/lib/storage';
import { safeRead, v, groupSchema } from '@/src/schemas';
import { DEFAULT_GROUPS, DOCK_GROUP_ID } from '@/src/utils/constants';
import { addGroup, updateGroup, removeGroup, toggleGroupExpand, addShortcutToGroup, moveShortcuts,
  copyShortcuts, reorderGroups, reorderShortcutsInGroup, getDockIds, setDockIds } from '@/src/services/groups';
import type { ShortcutGroup } from '@/src/utils/types';
import { STORAGE_KEYS } from './keys';

const cell = createStorageCell<ShortcutGroup[]>(STORAGE_KEYS.groups);
const schema = v.array(groupSchema);
export const groupsStore = createStore<{ list: ShortcutGroup[] }>({ list: DEFAULT_GROUPS });

export async function initGroupsStore(): Promise<void> {
  const apply = (raw?: ShortcutGroup[]) => groupsStore.set({ list: raw ? safeRead(schema, raw, DEFAULT_GROUPS) : DEFAULT_GROUPS });
  cell.watch(apply);
  try {
    apply(await cell.read());
  } catch (error) {
    console.error('[groups] init failed:', error);
    apply();
  }
}

const current = () => groupsStore.get().list;

function commit(list: ShortcutGroup[]) {
  groupsStore.set({ list });
  cell.stage(list);
}

export const groupsActions = {
  add(input: { name: string; color?: string }) {
    const { list, created } = addGroup(current(), input);
    commit(list);
    return created;
  },
  update(id: string, patch: Partial<Omit<ShortcutGroup, 'id' | 'createdAt' | 'updatedAt'>>) {
    commit(updateGroup(current(), id, patch));
  },
  remove(id: string) {
    commit(removeGroup(current(), id));
  },
  toggleExpand(id: string) {
    commit(toggleGroupExpand(current(), id));
  },
  addShortcut(groupId: string, shortcutId: string) {
    commit(addShortcutToGroup(current(), groupId, shortcutId));
  },
  move(ids: string[], sourceId: string | null, targetId: string | null, beforeId?: string) {
    commit(moveShortcuts(current(), ids, sourceId, targetId, beforeId));
  },
  copy(ids: string[], targetId: string) {
    commit(copyShortcuts(current(), ids, targetId));
  },
  reorder(activeId: string, overId: string) {
    commit(reorderGroups(current(), activeId, overId));
  },
  reorderShortcuts(groupId: string, activeId: string, overId: string) {
    commit(reorderShortcutsInGroup(current(), groupId, activeId, overId));
  },
  setPinned(shortcutId: string, pinned: boolean) {
    const groups = current();
    const ids = getDockIds(groups);
    if (ids.includes(shortcutId) === pinned) return;
    commit(setDockIds(groups, pinned ? [...ids, shortcutId] : ids.filter((id) => id !== shortcutId)));
  },
  initializeDock(ids: string[]) {
    const groups = current();
    if (ids.length && !groups.some(({ id }) => id === DOCK_GROUP_ID)) commit(setDockIds(groups, ids));
  },
  reorderDock(shortcutId: string, overId: string) {
    commit(reorderShortcutsInGroup(current(), DOCK_GROUP_ID, shortcutId, overId));
  },
  removeShortcutReferences(ids: string[]) {
    const removed = new Set(ids);
    const now = Date.now();
    const groups = current();
    const list = groups.map((group) => {
      const shortcutIds = group.shortcutIds.filter((id) => !removed.has(id));
      return shortcutIds.length === group.shortcutIds.length ? group : { ...group, shortcutIds, updatedAt: now };
    });
    if (list.some((group, index) => group !== groups[index])) commit(list);
  },
  replace: commit,
};
