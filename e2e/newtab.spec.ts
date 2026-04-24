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
  await page.waitForTimeout(500);
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

  test('搜索栏应该可见（直接展开状态）', async () => {
    const searchInput = page.locator('input[placeholder="搜索..."]');
    await expect(searchInput).toBeVisible();
  });

  test('搜索引擎选择器应该可见', async () => {
    const selectTrigger = page.locator('[role="combobox"]').first();
    await expect(selectTrigger).toBeVisible();
  });

  test('分组布局应该直接可见（无展开动画）', async () => {
    // 验证分组布局直接可见，没有展开箭头
    const newGroupButton = page.locator('button').filter({ hasText: '新建分组' });
    await expect(newGroupButton).toBeVisible();

    // 不应该有展开箭头（animate-bounce）
    const expandArrow = page.locator('[class*="animate-bounce"]');
    await expect(expandArrow).not.toBeVisible();
  });

  test('主题切换按钮应该存在', async () => {
    const themeButton = page.locator('button').filter({
      has: page.locator('svg')
    }).first();
    await expect(themeButton).toBeVisible();
  });
});

test.describe('分组布局功能测试', () => {
  let page: Page;

  test.beforeEach(async ({ context, extensionId }) => {
    page = await openNewTabPage(context, extensionId);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('新建分组按钮应该可见', async () => {
    const newGroupButton = page.locator('button').filter({ hasText: '新建分组' });
    await expect(newGroupButton).toBeVisible();
  });

  test('点击新建分组按钮打开分组弹窗', async () => {
    const newGroupButton = page.locator('button').filter({ hasText: '新建分组' });
    await newGroupButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('未分组区域应该显示', async () => {
    const ungroupedArea = page.locator('text=未分组');
    await expect(ungroupedArea).toBeVisible();
  });

  test('添加快捷方式按钮应该可见', async () => {
    const addButton = page.locator('[class*="rounded-xl border border-dashed"] button').first();
    await expect(addButton).toBeVisible();
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

  test('点击未分组添加按钮打开弹窗', async () => {
    const addButton = page.locator('[class*="rounded-xl border border-dashed"] button').first();
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
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
