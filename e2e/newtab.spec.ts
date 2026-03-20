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

test.describe('新标签页功能测试', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('页面应该正确渲染', async () => {
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('标题显示"快捷标签"', async () => {
    const title = page.locator('h1');
    await expect(title).toHaveText('快捷标签');
  });

  test('搜索栏应该可见', async () => {
    const searchInput = page.locator('input[placeholder="搜索..."]');
    await expect(searchInput).toBeVisible();
  });

  test('搜索引擎选择器应该可见', async () => {
    const selectTrigger = page.locator('[role="combobox"]').first();
    await expect(selectTrigger).toBeVisible();
  });

  test('快捷方式卡片应该存在', async () => {
    await page.waitForTimeout(500);
    const cards = await page.locator('[class*="rounded-xl"]').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('添加按钮应该可见', async () => {
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await expect(addButton).toBeVisible();
  });

  test('主题切换按钮应该存在', async () => {
    const themeButton = page.locator('button').filter({
      has: page.locator('svg')
    }).first();
    await expect(themeButton).toBeVisible();
  });
});

test.describe('快捷方式 CRUD 测试', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('点击添加按钮打开弹窗', async () => {
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h2')).toHaveText('添加快捷方式');
  });

  test('弹窗表单验证 - 空值时禁用提交', async () => {
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const saveButton = dialog.locator('button').filter({ hasText: '添加' });
    await expect(saveButton).toBeDisabled();
  });

  test('弹窗表单验证 - 填写后启用提交', async () => {
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');

    await dialog.locator('input#name').fill('测试网站');
    await dialog.locator('input#url').fill('https://example.com');

    const saveButton = dialog.locator('button').filter({ hasText: '添加' });
    await expect(saveButton).toBeEnabled();
  });

  test('取消按钮关闭弹窗', async () => {
    const addButton = page.locator('button').filter({ hasText: '添加' });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const cancelButton = dialog.locator('button').filter({ hasText: '取消' });
    await cancelButton.click();

    await expect(dialog).not.toBeVisible();
  });
});

test.describe('搜索引擎功能测试', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('可以切换搜索引擎', async () => {
    const selectTrigger = page.locator('[role="combobox"]').first();
    await selectTrigger.click();

    await page.waitForSelector('[role="option"]');

    const bingOption = page.locator('[role="option"]').filter({ hasText: 'Bing' });
    await bingOption.click();

    await expect(selectTrigger).toContainText('Bing');
  });

  test('搜索框可以输入', async () => {
    const searchInput = page.locator('input[placeholder="搜索..."]');
    await searchInput.fill('test query');

    await expect(searchInput).toHaveValue('test query');
  });
});
