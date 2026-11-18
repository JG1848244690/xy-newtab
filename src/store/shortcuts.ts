import { createStore } from '@/src/lib/store';
import { createStorageCell } from '@/src/lib/storage';
import { safeRead, v, shortcutSchema } from '@/src/schemas';
import { DEFAULT_SHORTCUTS } from '@/src/utils/constants';
import { addShortcut, addShortcuts, removeShortcuts, updateShortcut, reorderShortcuts } from '@/src/services/shortcuts';
import type { Shortcut } from '@/src/utils/types';
import { groupsActions } from './groups';
import { STORAGE_KEYS } from './keys';

const cell = createStorageCell<Shortcut[]>(STORAGE_KEYS.shortcuts);
const schema = v.array(shortcutSchema);
export const shortcutsStore = createStore<{ list: Shortcut[] }>({ list: DEFAULT_SHORTCUTS });

export async function initShortcutsStore(): Promise<void> {
  const apply = (raw: Shortcut[]) => shortcutsStore.set({ list: safeRead(schema, raw, DEFAULT_SHORTCUTS) });
  cell.watch(apply);
  try {
    const raw = await cell.read();
    if (raw !== undefined) apply(raw);
    else await cell.write(DEFAULT_SHORTCUTS);
  } catch (error) {
    console.error('[shortcuts] init failed:', error);
  }
}

const current = () => shortcutsStore.get().list;

function commit(list: Shortcut[]) {
  shortcutsStore.set({ list });
  cell.stage(list);
}

export const shortcutsActions = {
  add(input: { name: string; url: string; icon?: string }): Shortcut {
    const { list, created } = addShortcut(current(), input);
    commit(list);
    return created;
  },
  addMany(items: { name: string; url: string }[]) {
    const { list, added } = addShortcuts(current(), items);
    if (added.length) commit(list);
    return added.length;
  },
  removeMany(ids: string[]) {
    commit(removeShortcuts(current(), ids));
    groupsActions.removeShortcutReferences(ids);
  },
  update(id: string, patch: Partial<Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>>) {
    commit(updateShortcut(current(), id, patch));
  },
  reorder(fromId: string, toId: string) {
    commit(reorderShortcuts(current(), fromId, toId));
  },
  replace: commit,
};
