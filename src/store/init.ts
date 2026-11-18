import { initShortcutsStore } from './shortcuts';
import { initGroupsStore } from './groups';
import { initSettingsStore } from './settings';

let ready: Promise<void> | undefined;

export function initAllStores(): Promise<void> {
  ready ??= Promise.all([
    initShortcutsStore(),
    initGroupsStore(),
    initSettingsStore(),
  ]).then(() => undefined);
  return ready;
}
