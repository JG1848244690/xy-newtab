import { createStore } from '@/src/lib/store';
import { createStorageCell } from '@/src/lib/storage';
import { safeRead, settingsSchema } from '@/src/schemas';
import { DEFAULT_SETTINGS } from '@/src/utils/constants';
import type { Settings } from '@/src/utils/types';
import { STORAGE_KEYS } from './keys';

const cell = createStorageCell<Settings>(STORAGE_KEYS.settings);
export const settingsStore = createStore<Settings>(DEFAULT_SETTINGS);

export async function initSettingsStore(): Promise<void> {
  const apply = (raw?: Settings) => settingsStore.replace(raw ? safeRead(settingsSchema, raw, DEFAULT_SETTINGS) : DEFAULT_SETTINGS);
  cell.watch(apply);
  try {
    apply(await cell.read());
  } catch (error) {
    console.error('[settings] init failed:', error);
    apply();
  }
}

export const settingsActions = {
  patch(patch: Partial<Settings>): void {
    const next = { ...settingsStore.get(), ...patch };
    settingsStore.replace(next);
    cell.stage(next);
  },
};
