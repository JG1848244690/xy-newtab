/**
 * Favicon IndexedDB 缓存模块
 * 三级 fallback: 网络 → IndexedDB 缓存 → 首字母
 */

import { sendMessage } from '@/messaging';

const DB_NAME = 'favicon-cache';
const STORE_NAME = 'favicons';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * 初始化 IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[FaviconCache] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // key = domain, value = { base64, timestamp }
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * 从 IndexedDB 获取缓存的 favicon
 */
export async function getCachedFavicon(domain: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(domain);

      request.onsuccess = () => {
        const result = request.result;
        if (result?.base64) {
          resolve(result.base64);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('[FaviconCache] Failed to get cached favicon:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('[FaviconCache] IndexedDB error:', error);
    return null;
  }
}

/**
 * 保存 favicon 到 IndexedDB
 */
export async function setCachedFavicon(domain: string, base64: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const data = {
        base64,
        timestamp: Date.now(),
      };

      const request = store.put(data, domain);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.warn('[FaviconCache] Failed to cache favicon:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('[FaviconCache] Failed to save favicon:', error);
  }
}

/**
 * 从 URL 获取图片并转换为 Base64
 * 通过 background script 绕过 CORS 限制
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // 使用 background script fetch（不受 CORS 限制）
    const base64 = await sendMessage('favicon/fetch', url);
    return base64;
  } catch {
    return null;
  }
}

/**
 * 生成首字母 fallback SVG
 */
export function generateInitialFallback(name: string, size: number = 64): string {
  const initial = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="12" fill="url(#gradient)"/>
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.2"/>
        <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0.2"/>
      </linearGradient>
    </defs>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${size * 0.5}" font-weight="bold" fill="#3b82f6">${initial}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * 三级 fallback 获取 favicon
 * 1. 尝试网络获取
 * 2. 网络失败则从 IndexedDB 缓存读取
 * 3. 缓存也没有则返回首字母 SVG
 */
export async function getFaviconWithFallback(
  url: string,
  name: string
): Promise<{ src: string; isFallback: boolean }> {
  const domain = extractDomain(url);
  // 使用 DuckDuckGo API（更稳定，无重定向）
  const faviconUrl = getFaviconUrl(domain);

  // 1. 尝试网络获取
  const base64 = await fetchImageAsBase64(faviconUrl);

  if (base64) {
    // 网络成功，缓存到 IndexedDB
    await setCachedFavicon(domain, base64);
    return { src: base64, isFallback: false };
  }

  // 2. 网络失败，尝试从 IndexedDB 缓存读取
  const cached = await getCachedFavicon(domain);
  if (cached) {
    return { src: cached, isFallback: false };
  }

  // 3. 缓存也没有，返回首字母 fallback
  return { src: generateInitialFallback(name), isFallback: true };
}

/**
 * 从 URL 中提取域名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * 获取 Google Favicon 服务 URL
 */
export function getGoogleFaviconUrl(domain: string, size: number = 64): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * 获取 DuckDuckGo Favicon 服务 URL
 */
export function getDuckDuckGoFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * 获取 Icon Horse Favicon 服务 URL（备选，更稳定）
 */
export function getIconHorseUrl(domain: string): string {
  return `https://icon.horse/icon/${domain}`;
}

/**
 * 获取 Favicon URL（优先 Icon Horse，备选 DuckDuckGo）
 */
export function getFaviconUrl(domain: string): string {
  // Icon Horse 的 favicon API 更稳定
  return getIconHorseUrl(domain);
}

/**
 * 预加载并缓存 favicon（可选：用于后台预加载）
 */
export async function prefetchFavicon(url: string): Promise<void> {
  const domain = extractDomain(url);
  const faviconUrl = getGoogleFaviconUrl(domain, 64);

  // 检查是否已有缓存
  const cached = await getCachedFavicon(domain);
  if (cached) return;

  // 尝试网络获取并缓存
  const base64 = await fetchImageAsBase64(faviconUrl);
  if (base64) {
    await setCachedFavicon(domain, base64);
  }
}

/**
 * 清理过期的缓存（可选：超过 30 天的缓存）
 */
export async function clearExpiredCache(daysToExpire: number = 30): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    const expireTime = Date.now() - daysToExpire * 24 * 60 * 60 * 1000;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const data = cursor.value;
        if (data.timestamp < expireTime) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn('[FaviconCache] Failed to clear expired cache:', error);
  }
}
