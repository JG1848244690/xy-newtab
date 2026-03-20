import { Page, test as base } from '@playwright/test';

// 扩展页面类型
type ExtensionPage = 'newtab' | 'popup';

// 获取扩展页面 URL
export function getExtensionPageUrl(page: ExtensionPage): string {
  // Chrome 扩展的 URL 格式
  return `chrome-extension://localhost/${page}.html`;
}

// 等待扩展加载完成
export async function waitForExtensionReady(page: Page): Promise<void> {
  // 等待页面加载
  await page.waitForLoadState('domcontentloaded');
  // 等待 React 渲染完成
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  });
}

// 扩展测试 fixture
export const test = base.extend<{
  extensionPage: Page;
}>({
  extensionPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
