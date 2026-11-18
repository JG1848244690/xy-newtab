// IndexedDB 格式与旧版本兼容。服务工作线程为所有标签页共享下载队列。
const DATABASE = 'favicon-cache';
const STORE = 'favicons';
const RETRY_AFTER = 12 * 60 * 60 * 1000;
const MAX_ICON_BYTES = 256 * 1024;
const MAX_PARALLEL = 6;

interface CacheEntry {
  base64: string | null;
  timestamp: number;
}

let database: Promise<IDBDatabase> | undefined;
const inFlight = new Map<string, Promise<string | null>>();
const downloads: Array<() => void> = [];
let activeDownloads = 0;

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : 'https://' + url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.hostname : '';
  } catch {
    return '';
  }
}

function openDB(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => { database = undefined; };
      resolve(db);
    };
  });
  return database;
}

async function readEntry(domain: string): Promise<CacheEntry | undefined> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const request = db.transaction(STORE).objectStore(STORE).get(domain);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

async function writeEntry(domain: string, base64: string | null): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.oncomplete = transaction.onabort = () => resolve();
      transaction.objectStore(STORE).put({ base64, timestamp: Date.now() }, domain);
    });
  } catch {
    // 本地缓存不可用时仍返回本次下载结果。
  }
}

async function fetchIcon(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(4000) });
    if (!response.ok || Number(response.headers.get('content-length')) > MAX_ICON_BYTES) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/') || blob.size === 0 || blob.size > MAX_ICON_BYTES) return null;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return 'data:' + blob.type + ';base64,' + btoa(binary);
  } catch {
    return null;
  }
}

function downloadIcon(domain: string): Promise<string | null> {
  return new Promise((resolve) => {
    const run = async () => {
      activeDownloads++;
      const host = encodeURIComponent(domain);
      let src = null;
      try {
        for (const url of [
          'https://icon.horse/icon/' + host,
          'https://icons.duckduckgo.com/ip3/' + host + '.ico',
          'https://www.google.com/s2/favicons?domain=' + host + '&sz=64',
        ]) {
          src = await fetchIcon(url);
          if (src) break;
        }
        await writeEntry(domain, src);
      } finally {
        activeDownloads--;
        downloads.shift()?.();
        resolve(src);
      }
    };

    if (activeDownloads < MAX_PARALLEL) void run();
    else downloads.push(run);
  });
}

export function loadFavicon(domain: string): Promise<string | null> {
  if (!domain || extractDomain(domain) !== domain) return Promise.resolve(null);
  const pending = inFlight.get(domain);
  if (pending) return pending;

  const task = (async () => {
    const cached = await readEntry(domain);
    if (cached?.base64?.startsWith('data:image/')) return cached.base64;
    if (cached?.base64 === null && Date.now() - cached.timestamp < RETRY_AFTER) return null;
    return downloadIcon(domain);
  })().finally(() => inFlight.delete(domain));
  inFlight.set(domain, task);
  return task;
}
