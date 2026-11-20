import { storage } from '@wxt-dev/storage';

type LocalKey = `local:${string}`;

const queued = new Map<LocalKey, unknown>();
const writing = new Set<LocalKey>();
let pendingFlush: Promise<void> | undefined;

function stageWrite(key: LocalKey, value: unknown): void {
  queued.set(key, value);
  pendingFlush ??= Promise.resolve().then(flush);
}

async function flush(): Promise<void> {
  while (queued.size) {
    const batch = Array.from(queued, ([key, value]) => ({ key, value }));
    queued.clear();
    for (const { key } of batch) writing.add(key);
    try {
      // 同一轮里的书签与分组变更一起保存，例如导入和删除。
      await storage.setItems(batch);
    } catch (error) {
      console.error('[storage] write failed:', error);
    } finally {
      for (const { key } of batch) writing.delete(key);
    }
  }
  pendingFlush = undefined;
}

export async function persistStorageItems(values: Record<string, unknown>): Promise<void> {
  while (pendingFlush) await pendingFlush;
  await storage.setItems(Object.entries(values).map(([key, value]) => ({ key: `local:${key}` as const, value })));
}

export function createStorageCell<T>(key: string) {
  const fullKey: LocalKey = `local:${key}`;
  return {
    async read(): Promise<T | undefined> {
      return (await storage.getItem<T>(fullKey)) ?? undefined;
    },
    write(value: T): Promise<void> {
      return storage.setItem(fullKey, value);
    },
    stage(value: T): void {
      stageWrite(fullKey, value);
    },
    watch(listener: (next: T) => void): void {
      storage.watch<T>(fullKey, (next) => {
        // 当前界面已应用待保存的值，旧写入的通知不应覆盖更新的本地状态。
        if (next != null && !queued.has(fullKey) && !writing.has(fullKey)) listener(next);
      });
    },
  };
}
