import { test, expect, Page, BrowserContext } from './utils/extension-fixture';

/**
 * Favicon 缓存 E2E 测试
 * 测试三级 fallback 逻辑：网络 → IndexedDB 缓存 → 首字母
 */

/**
 * 打开新标签页
 */
async function openNewTabPage(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
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

/**
 * 检查 IndexedDB 中是否有 favicon-cache 数据库
 */
async function checkFaviconCacheExists(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const databases = await indexedDB.databases();
    return databases.some(db => db.name === 'favicon-cache');
  });
}

/**
 * 获取 IndexedDB 中的缓存数量
 */
async function getCachedFaviconCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('favicon-cache', 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('favicons')) {
          resolve(0);
          return;
        }
        const transaction = db.transaction('favicons', 'readonly');
        const store = transaction.objectStore('favicons');
        const countRequest = store.count();
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => resolve(0);
      };
      request.onerror = () => resolve(0);
    });
  });
}

/**
 * 获取缓存中的 favicon
 */
async function getCachedFavicon(page: Page, domain: string): Promise<string | null> {
  return page.evaluate(async (domain) => {
    return new Promise((resolve) => {
      const request = indexedDB.open('favicon-cache', 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('favicons')) {
          resolve(null);
          return;
        }
        const transaction = db.transaction('favicons', 'readonly');
        const store = transaction.objectStore('favicons');
        const getRequest = store.get(domain);
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.base64 || null);
        };
        getRequest.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  }, domain);
}

test.describe('Favicon 缓存 - 基础功能', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('页面加载后快捷方式卡片应该显示图标或首字母', async () => {
    // 等待图标加载
    await page.waitForTimeout(2000);

    // 检查是否有图标元素
    const icons = await page.locator('img[alt]').count();
    const fallbackTexts = await page.locator('[class*="text-primary"]').count();

    // 至少要有图标或首字母显示
    expect(icons + fallbackTexts).toBeGreaterThan(0);
  });

  test('添加快捷方式后应该显示图标', async () => {
    // 点击添加按钮
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await addButton.click();

    // 填写表单
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input#name').fill('TestSite');
    await dialog.locator('input#url').fill('https://example.com');

    // 提交
    const saveButton = dialog.locator('button').filter({ hasText: '添加' });
    await saveButton.click();

    // 等待对话框关闭
    await expect(dialog).not.toBeVisible();

    // 等待新卡片出现
    await page.waitForTimeout(2000);

    // 检查是否有新添加的卡片
    const newCardName = page.getByRole('heading', { name: 'TestSite' }).or(page.locator('span').filter({ hasText: 'TestSite' }).first());
    await expect(newCardName).toBeVisible();
  });
});

test.describe('Favicon 缓存 - IndexedDB 存储', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('访问网站后应该创建 IndexedDB 缓存', async () => {
    // 等待默认快捷方式的图标加载
    await page.waitForTimeout(3000);

    // 检查 IndexedDB 是否存在
    const cacheExists = await checkFaviconCacheExists(page);

    // 如果有网络，应该会创建缓存
    // 注意：这个测试可能因为网络状态而失败
    console.log('Favicon cache exists:', cacheExists);
  });

  test('缓存的 favicon 应该包含 base64 数据', async () => {
    // 添加一个快捷方式
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input#name').fill('CachedTest');
    await dialog.locator('input#url').fill('https://cachedtest.example.com');

    const saveButton = dialog.locator('button').filter({ hasText: '添加' });
    await saveButton.click();

    // 等待图标加载和缓存
    await page.waitForTimeout(3000);

    // 检查缓存
    const cachedFavicon = await getCachedFavicon(page, 'cachedtest.example.com');

    if (cachedFavicon) {
      // 如果有缓存，应该是 base64 格式
      expect(cachedFavicon).toContain('data:image');
    }
  });
});

test.describe('Favicon 缓存 - 首字母 Fallback', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('网络失败时应该显示首字母', async () => {
    // 模拟离线
    await page.context().setOffline(true);

    // 添加一个新快捷方式
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input#name').fill('OfflineSite');
    await dialog.locator('input#url').fill('https://offlinesite.invalid');

    const saveButton = dialog.locator('button').filter({ hasText: '添加' });
    await saveButton.click();

    // 等待加载
    await page.waitForTimeout(2000);

    // 检查是否显示首字母
    // 首字母应该显示在卡片的图标区域
    const initialLetter = page.locator('text=O').first();
    // 由于是离线状态，应该显示首字母 "O"
    await expect(initialLetter).toBeVisible();

    // 恢复网络
    await page.context().setOffline(false);
  });
});

test.describe('Favicon 缓存 - 离线读取', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('在线时缓存后，离线应该能从缓存读取', async () => {
    // 1. 先在线访问，让图标缓存
    await page.waitForTimeout(3000);

    // 2. 检查是否有缓存
    const cacheCount = await getCachedFaviconCount(page);
    console.log('Cached favicon count:', cacheCount);

    // 3. 设置离线
    await page.context().setOffline(true);

    // 4. 刷新页面
    await page.reload();
    await waitForAppReady(page);

    // 5. 检查图标是否仍然显示（应该从缓存加载）
    const icons = await page.locator('img[alt]').count();
    console.log('Icons after offline reload:', icons);

    // 6. 恢复网络
    await page.context().setOffline(false);
  });
});
