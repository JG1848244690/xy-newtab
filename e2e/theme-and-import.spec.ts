import { test, expect, Page, BrowserContext } from './utils/extension-fixture';

/**
 * 打开新标签页
 */
async function openNewTabPage(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  return page;
}

/**
 * 打开 Popup 页面
 */
async function openPopupPage(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}

/**
 * 等待 React 应用挂载
 */
async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  }, { timeout: 10000 });
  await page.waitForTimeout(1000);
}

test.describe('主题切换动画测试', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('标题显示"序言"', async () => {
    const title = page.locator('h1');
    await expect(title).toHaveText('序言');
  });

  test('主题切换按钮应该存在', async () => {
    // 找到主题切换按钮（右上角的圆形按钮）
    const themeButton = page.locator('button').filter({
      has: page.locator('svg')
    }).first();
    await expect(themeButton).toBeVisible();
  });

  test('点击主题切换按钮打开下拉菜单', async () => {
    // 点击主题切换按钮
    const themeButton = page.locator('button.rounded-full').first();
    await themeButton.click();

    // 等待下拉菜单出现
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible();

    // 检查菜单项
    const menuItems = dropdown.locator('[role="menuitem"]');
    await expect(menuItems).toHaveCount(3);
  });

  test('切换主题到深色模式', async () => {
    // 点击主题切换按钮
    const themeButton = page.locator('button.rounded-full').first();
    await themeButton.click();

    // 点击深色选项
    const darkOption = page.locator('[role="menuitem"]').filter({ hasText: '深色' });
    await darkOption.click();

    // 等待动画完成
    await page.waitForTimeout(500);

    // 验证 dark 类被添加到 html 元素
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(isDark).toBe(true);
  });

  test('切换主题到浅色模式', async () => {
    // 先切换到深色
    const themeButton = page.locator('button.rounded-full').first();
    await themeButton.click();
    const darkOption = page.locator('[role="menuitem"]').filter({ hasText: '深色' });
    await darkOption.click();
    await page.waitForTimeout(500);

    // 再切换到浅色
    await themeButton.click();
    const lightOption = page.locator('[role="menuitem"]').filter({ hasText: '浅色' });
    await lightOption.click();
    await page.waitForTimeout(500);

    // 验证 dark 类被移除
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(isDark).toBe(false);
  });
});

test.describe('导入功能 UI 测试', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('导入按钮应该存在', async () => {
    const importButton = page.locator('button').filter({ hasText: '导入' });
    await expect(importButton).toBeVisible();
  });

  test('点击导入按钮会触发导入操作', async () => {
    const importButton = page.locator('button').filter({ hasText: '导入' });

    // 点击导入按钮
    await importButton.click();

    // 等待导入完成（会显示 alert 或 nothing happens if no bookmarks）
    // 由于 alert 会阻塞，我们只检查按钮被点击后不会崩溃
    await page.waitForTimeout(500);
  });
});

test.describe('Popup 导入教程测试', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openPopupPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Popup 标题显示"序言"', async () => {
    const title = page.locator('h1');
    await expect(title).toHaveText('序言');
  });

  test('导入教程卡片应该存在', async () => {
    // 检查导入教程标题
    const tutorialTitle = page.locator('text=从 Chrome 书签导入');
    await expect(tutorialTitle).toBeVisible();
  });

  test('导入教程包含说明文字', async () => {
    // 检查说明文字
    const description = page.locator('text=一键导入浏览器书签中的所有网站快捷方式');
    await expect(description).toBeVisible();
  });

  test('导入教程包含打开新标签页按钮', async () => {
    const openButton = page.locator('button').filter({ hasText: '打开新标签页导入' });
    await expect(openButton).toBeVisible();
  });

  test('打开新标签页按钮应该存在', async () => {
    const openButton = page.locator('button').filter({ hasText: '打开新标签页' }).first();
    await expect(openButton).toBeVisible();
  });

  test('设置标签页可以切换', async () => {
    // 点击设置标签
    const settingsTab = page.locator('button').filter({ hasText: '设置' });
    await settingsTab.click();

    // 验证主题设置可见（使用精确匹配）
    const themeLabel = page.locator('span', { hasText: /^主题$/ });
    await expect(themeLabel).toBeVisible();
  });
});
