/**
 * 一键初始化所有 store（在 App 入口 mount 时调用一次）
 */

import { initShortcutsStore } from './shortcuts';
import { initGroupsStore } from './groups';
import { initSettingsStore } from './settings';

export async function initAllStores(): Promise<void> {
  await Promise.all([
    initShortcutsStore(),
    initGroupsStore(),
    initSettingsStore(),
  ]);
}
