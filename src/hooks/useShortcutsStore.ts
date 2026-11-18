import { useStoreState } from '@/src/lib/store';
import { shortcutsStore, shortcutsActions } from '@/src/store/shortcuts';

export function useShortcutsStore() {
  return {
    shortcuts: useStoreState(shortcutsStore, (state) => state.list),
    actions: shortcutsActions,
  };
}
