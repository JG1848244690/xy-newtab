import { Page, BrowserContext } from '@playwright/test';

/**
 * 获取已加载扩展的 ID
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  // 获取所有扩展的背景页
  const backgrounds = context.serviceWorkers();

  if (backgrounds.length > 0) {
    const url = backgrounds[0].url();
    // URL 格式: chrome-extension://extension-id/background.js
    const match = url.match(/chrome-extension:\/\/([^/]+)/);
    if (match) {
      return match[1];
    }
  }

  // 等待 service worker
  const serviceWorker = await context.waitForEvent('serviceworker', { timeout: 5000 }).catch(() => null);

  if (serviceWorker) {
    const url = serviceWorker.url();
    const match = url.match(/chrome-extension:\/\/([^/]+)/);
    if (match) {
      return match[1];
    }
  }

  throw new Error('无法获取扩展 ID');
}

/**
 * 打开扩展的新标签页
 */
export async function openNewTab(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  return page;
}

/**
 * 打开扩展的弹窗
 */
export async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}

/**
 * 等待 React 应用挂载
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0 && !root.textContent?.includes('加载中');
  }, { timeout: 10000 });
}
