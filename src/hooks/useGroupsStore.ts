import { useMemo } from 'react';
import { useStoreState } from '@/src/lib/store';
import { groupsStore, groupsActions } from '@/src/store/groups';
import { getDockIds } from '@/src/services/groups';
import { DOCK_GROUP_ID } from '@/src/utils/constants';

export function useGroupsStore() {
  const records = useStoreState(groupsStore, (state) => state.list);
  const groups = useMemo(() => records.filter((group) => group.id !== DOCK_GROUP_ID), [records]);
  const pinnedIds = useMemo(() => getDockIds(records), [records]);
  return {
    groups,
    pinnedIds,
    records,
    addShortcutToGroup: groupsActions.addShortcut,
    actions: groupsActions,
  };
}
