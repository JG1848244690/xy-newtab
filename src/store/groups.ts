/**
 * Groups store
 */

import { createStore } from '@/src/lib/store';
import { createStorageCell } from '@/src/lib/storage';
import { safeRead, v } from '@/src/schemas';
import { groupSchema } from '@/src/schemas';
import { DEFAULT_GROUPS, DOCK_GROUP_ID } from '@/src/utils/constants';
import {
  addGroup,
  updateGroup,
  removeGroup,
  toggleGroupExpand,
  addShortcutToGroup,
  removeShortcutFromGroup,
  moveShortcuts,
  copyShortcuts,
  reorderGroups,
  reorderShortcutsInGroup,
} from '@/src/services/groups';
import type { ShortcutGroup } from '@/src/utils/types';
import { STORAGE_KEYS } from './keys';

interface GroupsState {
  list: ShortcutGroup[];
  loaded: boolean;
}

const cell = createStorageCell<ShortcutGroup[]>(STORAGE_KEYS.groups);
export const groupsStore = createStore<GroupsState>({ list: [], loaded: false });

/** 防抖写：50ms 内多次 setItem 只触发最后一次 */
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingValue: ShortcutGroup[] | null = null;
const scheduleWrite = (value: ShortcutGroup[]): void => {
  pendingValue = value;
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    const v = pendingValue;
    writeTimer = null;
    pendingValue = null;
    if (v) {
      cell.write(v).catch((e) => console.error('[groups] persist failed:', e));
    }
  }, 50);
};

let initialized = false;
export async function initGroupsStore(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    cell.watch((next) => {
      if (next === undefined) return;
      const current = groupsStore.get().list;
      if (
        current.length === next.length &&
        current.every(
          (g, i) =>
            g === next[i] ||
            (g.id === next[i]?.id && g.updatedAt === next[i]?.updatedAt)
        )
      ) {
        return;
      }
      groupsStore.set({ list: next });
    });

    const raw = await cell.read();
    let list = safeRead(v.array(groupSchema), raw, DEFAULT_GROUPS);
    // 确保系统 dock 分组存在(dock 布局用它存书签,group 布局过滤掉不渲染)
    // 注意:updatedAt 必须用 0(占位符),不能 Date.now()。
    // 否则新设备 init 后本地空 dock 组会比云端"新",pullAndMerge 的 last-write-wins
    // 会判本地胜,丢掉云端 dock 书签,甚至后续上传把云端 dock 整体清空(数据丢失)。
    if (!list.some((g) => g.id === DOCK_GROUP_ID)) {
      list = [
        ...list,
        {
          id: DOCK_GROUP_ID,
          name: 'Dock',
          color: 'blue',
          shortcutIds: [],
          isExpanded: true,
          createdAt: 0,
          updatedAt: 0,
        },
      ];
      // 持久化新分组
      await cell.write(list);
    }
    groupsStore.replace({ list, loaded: true });
  } catch (e) {
    console.error('[groups] init failed:', e);
    groupsStore.replace({ list: DEFAULT_GROUPS, loaded: true });
  }
}

export const groupsActions = {
  add(input: { name: string; color?: string }) {
    const { list, created } = addGroup(groupsStore.get().list, input);
    groupsStore.set({ list });
    scheduleWrite(list);
    return created;
  },

  update(id: string, patch: Partial<Omit<ShortcutGroup, 'id' | 'createdAt' | 'updatedAt'>>) {
    const list = updateGroup(groupsStore.get().list, id, patch);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  remove(id: string) {
    const list = removeGroup(groupsStore.get().list, id);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  /**
   * toggleExpand: 展开/折叠纯 UI 状态,仍写 storage 让刷新后保留折叠状态。
   */
  toggleExpand(id: string) {
    const list = toggleGroupExpand(groupsStore.get().list, id);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  addShortcut(groupId: string, shortcutId: string) {
    const list = addShortcutToGroup(groupsStore.get().list, groupId, shortcutId);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  removeShortcut(groupId: string, shortcutId: string) {
    const list = removeShortcutFromGroup(groupsStore.get().list, groupId, shortcutId);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  move(shortcutIds: string[], sourceId: string | null, targetId: string | null) {
    const list = moveShortcuts(groupsStore.get().list, shortcutIds, sourceId, targetId);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  /** 复制 shortcut:source 保留,target 增加 ids(自动去重) */
  copy(shortcutIds: string[], targetId: string | null) {
    const list = copyShortcuts(groupsStore.get().list, shortcutIds, targetId);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  reorder(activeId: string, overId: string) {
    const list = reorderGroups(groupsStore.get().list, activeId, overId);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  reorderShortcuts(groupId: string, activeId: string, overId: string) {
    const list = reorderShortcutsInGroup(groupsStore.get().list, groupId, activeId, overId);
    groupsStore.set({ list });
    scheduleWrite(list);
  },

  /**
   * replace: 无条件覆盖本地数据(导入备份用)
   */
  replace(next: ShortcutGroup[]) {
    groupsStore.set({ list: next });
    scheduleWrite(next);
  },
};