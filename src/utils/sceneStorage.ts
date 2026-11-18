const DATABASE = 'xy-tab-scene-bg';
const STORE = 'scenes';

export interface StoredScene {
  id: string;
  name: string;
  packageFile: File;
  project: Record<string, unknown>;
}

export async function readSceneFiles(files: File[]): Promise<StoredScene | null> {
  const packages = files.filter((file) => file.name.toLowerCase().endsWith('.pkg'));
  if (packages.length !== 1) return null;

  const packageFile = packages[0];
  const header = await packageFile.slice(0, 8).arrayBuffer();
  if (packageFile.size < 16 || header.byteLength < 8 ||
      new TextDecoder().decode(header.slice(4, 8)) !== 'PKGV') return null;

  const path = packageFile.webkitRelativePath;
  const folder = path.slice(0, path.lastIndexOf('/') + 1);
  const metadata = files.find((file) => file.name.toLowerCase() === 'project.json' &&
    (!folder || file.webkitRelativePath.toLowerCase() === (folder + 'project.json').toLowerCase()));

  const raw: unknown = metadata ? JSON.parse((await metadata.text()).replace(/^\uFEFF/, '')) : {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const project = raw as Record<string, unknown>;
  if (project.type !== undefined && String(project.type).toLowerCase() !== 'scene') return null;

  const directoryName = folder.split('/').filter(Boolean).at(-1);
  const name = typeof project.title === 'string' && project.title.trim()
    ? project.title.trim()
    : directoryName || packageFile.name;
  return { id: crypto.randomUUID(), name, packageFile, project: { ...project, type: 'scene' } };
}

function withSceneStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE, mode);
      const result = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () => {
        db.close();
        resolve(result.result);
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error ?? result.error);
      };
    };
  });
}

export async function saveBackgroundScene(scene: StoredScene): Promise<void> {
  await withSceneStore('readwrite', (store) => store.put(scene));
}

export function loadBackgroundScene(id: string): Promise<StoredScene | undefined> {
  return withSceneStore('readonly', (store) => store.get(id));
}

export async function removeBackgroundScene(id: string): Promise<void> {
  await withSceneStore('readwrite', (store) => store.delete(id));
}
