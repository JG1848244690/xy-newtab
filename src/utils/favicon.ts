/**
 * Favicon 获取工具
 */

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
 * 获取 favicon.im 服务 URL (备选)
 */
export function getFaviconImUrl(domain: string): string {
  return `https://favicon.im/${domain}?larger=true`;
}

/**
 * 获取网站的 favicon URL
 * 优先使用 Google 服务，失败时返回备选
 */
export function getFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  return getGoogleFaviconUrl(domain, 64);
}

/**
 * 检查 favicon 是否可用
 */
export async function checkFaviconAvailable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}
