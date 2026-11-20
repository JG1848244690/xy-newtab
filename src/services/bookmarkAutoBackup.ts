import { STORAGE_KEYS } from '@/src/store/keys';
import { groupSchema, settingsSchema, shortcutSchema, v } from '@/src/schemas';
import { DEFAULT_GROUPS, DEFAULT_SETTINGS } from '@/src/utils/constants';
import { bookmarkBackup } from '@/src/utils/importExport';

export const BACKUP_STATE_KEY = 'bookmarkAutoBackup';
export const autoBackupSupported = import.meta.env.MANIFEST_VERSION === 3 &&
  (import.meta.env.CHROME || import.meta.env.EDGE);

const periodicAlarm = 'bookmark-backup-periodic';
const changeAlarm = 'bookmark-backup-changed';
const stateChange = new Set<string>(Object.values(STORAGE_KEYS));

export type BackupStatus = {
  enabled: boolean;
  folder?: string;
  lastSavedAt?: number;
  outcome?: 'empty' | 'error';
  pending?: boolean;
};

type SavedFile = { slot: 1 | 2; hash: string; at: number };
type BackupState = {
  enabled: boolean;
  instance?: string;
  last?: SavedFile;
  outcome?: BackupStatus['outcome'];
  pending?: SavedFile & { id: number };
};

async function readState(): Promise<BackupState> {
  return (await browser.storage.local.get(BACKUP_STATE_KEY))[BACKUP_STATE_KEY] as BackupState | undefined
    ?? { enabled: false };
}

function writeState(state: BackupState) {
  return browser.storage.local.set({ [BACKUP_STATE_KEY]: state });
}

function folderFor(instance: string) {
  return 'Xuyan-Backups/' + instance;
}

export async function getBackupStatus(): Promise<BackupStatus> {
  const state = await readState();
  return {
    enabled: state.enabled,
    folder: state.instance && folderFor(state.instance),
    lastSavedAt: state.last?.at,
    outcome: state.outcome,
    pending: !!state.pending,
  };
}

let work: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const result = work.then(task);
  work = result.catch(() => {});
  return result;
}

async function refreshAlarm() {
  const state = await readState();
  if (!state.enabled) return;
  if (!await browser.alarms.get(periodicAlarm)) {
    await browser.alarms.create(periodicAlarm, { periodInMinutes: 15 });
  }
}

async function settle(state: BackupState): Promise<BackupState> {
  if (!state.pending) return state;
  const [download] = await browser.downloads.search({ id: state.pending.id });
  if (download?.state === 'in_progress') return state;
  const { pending, ...rest } = state;
  const next: BackupState = download?.state === 'complete' && download.exists !== false
    ? { ...rest, last: { slot: pending.slot, hash: pending.hash, at: pending.at }, outcome: undefined }
    : { ...rest, outcome: 'error' };
  await writeState(next);
  return next;
}

async function takeSnapshot() {
  const raw = await browser.storage.local.get(Object.values(STORAGE_KEYS));
  const shortcuts = v.array(shortcutSchema).parse(raw[STORAGE_KEYS.shortcuts] ?? []);
  const groups = v.array(groupSchema).parse(raw[STORAGE_KEYS.groups] ?? DEFAULT_GROUPS);
  const settings = settingsSchema.parse({ ...DEFAULT_SETTINGS, ...raw[STORAGE_KEYS.settings] as object });
  return bookmarkBackup(shortcuts, groups, settings);
}

async function saveBackup(force = false): Promise<void> {
  let state = await readState();
  const instance = state.instance;
  if (!state.enabled || !instance || !await browser.permissions.contains({ permissions: ['downloads'] })) return;
  try {
    state = await settle(state);
    if (state.pending) return;
    const snapshot = await takeSnapshot();
    if (!snapshot.shortcuts.length) {
      if (state.outcome !== 'empty') await writeState({ ...state, outcome: 'empty' });
      return;
    }
    const { exportedAt, ...content } = snapshot;
    const bytes = new TextEncoder().encode(JSON.stringify(content));
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    const hash = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (!force && state.last?.hash === hash) {
      if (state.outcome) await writeState({ ...state, outcome: undefined });
      return;
    }

    const slot = state.last?.slot === 1 ? 2 : 1;
    const filename = folderFor(instance) + '/bookmarks-' + slot + '.json';
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    // Service workers cannot create blob URLs.
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const id = await browser.downloads.download({ url, filename, conflictAction: 'overwrite', saveAs: false });
    const pending: BackupState = { ...state, pending: { id, slot, hash, at: exportedAt }, outcome: undefined };
    await writeState(pending);
    await settle(pending);
  } catch {
    await writeState({ ...state, outcome: 'error' });
  }
}

export function setBackupEnabled(enabled: boolean) {
  return serialize(async () => {
    const state = await readState();
    if (enabled && !await browser.permissions.contains({ permissions: ['downloads'] })) {
      throw new Error('Downloads permission is required');
    }
    await writeState({
      ...state,
      enabled,
      instance: state.instance ?? (enabled ? crypto.randomUUID() : undefined),
    });
    if (enabled) {
      registerDownloadListener();
      await refreshAlarm();
      await saveBackup();
    } else {
      await browser.alarms.clear(periodicAlarm);
      await browser.alarms.clear(changeAlarm);
    }
    return getBackupStatus();
  });
}

export function backupNow() {
  return serialize(async () => {
    await saveBackup(true);
    return getBackupStatus();
  });
}

function report(error: unknown) {
  console.warn('[bookmark-backup]', error);
}

export function registerBookmarkAutoBackup() {
  browser.alarms.onAlarm.addListener(({ name }) => {
    if (name === periodicAlarm || name === changeAlarm) void serialize(() => saveBackup()).catch(report);
  });
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !Object.keys(changes).some((key) => stateChange.has(key))) return;
    void serialize(async () => {
      if ((await readState()).enabled && !await browser.alarms.get(changeAlarm)) {
        await browser.alarms.create(changeAlarm, { delayInMinutes: 1 });
      }
    }).catch(report);
  });
  browser.permissions.onRemoved.addListener(({ permissions }) => {
    if (permissions?.includes('downloads')) void setBackupEnabled(false).catch(report);
  });
  registerDownloadListener();
  void serialize(refreshAlarm).catch(report);
}

let watchingDownloads = false;

function registerDownloadListener() {
  if (watchingDownloads || !browser.downloads) return;
  browser.downloads.onChanged.addListener(({ id, state }) => {
    if (!state || state.current === 'in_progress') return;
    void serialize(async () => {
      const backup = await readState();
      if (backup.pending?.id === id) await settle(backup);
    }).catch(report);
  });
  watchingDownloads = true;
}
