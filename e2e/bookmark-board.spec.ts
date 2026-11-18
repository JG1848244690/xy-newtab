import { chromium, expect, test as base, type BrowserContext, type Locator, type Page, type Worker } from '@playwright/test';
import path from 'node:path';

const icon = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCR8AAAAASUVORK5CYII=';
const shortcuts = [
  { id: 'alpha', name: 'Alpha', url: 'https://cached.test' },
  { id: 'extra', name: 'Extra bookmark', url: 'https://missing.test' },
  { id: 'bravo', name: 'Bravo', url: 'https://fresh.test' },
  { id: 'charlie', name: 'Charlie', url: 'https://fresh.test/second' },
  { id: 'legacy', name: 'Legacy pin', url: 'https://cached.test/legacy' },
].map((item) => ({ ...item, createdAt: 1, updatedAt: 1 }));

const groups = [
  { id: 'work', name: 'Work', shortcutIds: ['alpha', 'extra'], isExpanded: true },
  { id: 'read', name: 'Read', shortcutIds: ['bravo', 'charlie'], isExpanded: true },
  { id: 'empty', name: 'Empty', shortcutIds: [], isExpanded: false },
  { id: 'sys-dock', name: 'Dock', shortcutIds: ['legacy'], isExpanded: true },
].map((group) => ({ ...group, createdAt: 1, updatedAt: 1 }));

const test = base.extend<{ board: Page; extensionContext: BrowserContext; worker: Worker }>({
  extensionContext: async ({}, use) => {
    const extension = path.resolve(process.env.BOOKMARK_TEST_EXTENSION || '.output/chrome-mv3-dev');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      locale: 'zh-CN',
      args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension],
    });
    try {
      await use(context);
    } finally {
      await context.close();
    }
  },
  worker: async ({ extensionContext }, use) => {
    await use(extensionContext.serviceWorkers()[0] ?? await extensionContext.waitForEvent('serviceworker'));
  },
  board: async ({ extensionContext, worker }, use) => {
    await worker.evaluate(async (fixture) => {
      const mock = { calls: [] as string[] };
      Object.assign(globalThis, { bookmarkFaviconMock: mock });
      globalThis.fetch = async (input) => {
        const url = String(input);
        mock.calls.push(url);
        if (url.includes('missing.test') || (url.includes('fresh.test') && url.includes('icon.horse'))) {
          return new Response(null, { status: 404 });
        }
        return new Response(Uint8Array.from(atob(fixture.icon), (value) => value.charCodeAt(0)), {
          headers: { 'content-type': 'image/png' },
        });
      };

      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('favicon-cache', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('favicons');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('favicons', 'readwrite');
          transaction.oncomplete = () => { db.close(); resolve(); };
          transaction.onerror = () => reject(transaction.error);
          transaction.objectStore('favicons').put({
            base64: 'data:image/png;base64,' + fixture.icon,
            timestamp: 1,
          }, 'cached.test');
        };
      });

      await chrome.storage.local.set({
        shortcuts: fixture.shortcuts,
        groups: fixture.groups,
        settings: { iconsPerRow: 8, layout: 'group', language: 'zh_CN', background: { type: 'color', color: '#dce4ef' } },
      });
    }, { icon, shortcuts, groups });
    const page = await extensionContext.newPage();
    await page.goto(new URL('/newtab.html', worker.url()).href);
    await expect(page.getByRole('region', { name: 'Work', exact: true })).toBeVisible();
    await use(page);
  },
});

const section = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
const link = (page: Page, group: string, label: string) => section(page, group).getByRole('link', { name: label, exact: true });
const dock = (page: Page) => page.getByRole('navigation', { name: 'Dock', exact: true });

async function switchLayout(page: Page, label: '底部 Dock' | '分组') {
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.keyboard.press('Escape');
}

test('defaults to a glass Dock and respects reduced motion', async ({ board }) => {
  await board.route('https://images.unsplash.com/**', (route) => route.abort());
  await board.evaluate(async () => {
    const { groups } = await chrome.storage.local.get('groups');
    await chrome.storage.local.set({ groups: (groups as { id: string }[]).filter(({ id }) => id !== 'sys-dock') });
    await chrome.storage.local.remove('settings');
  });
  await board.reload();
  await expect(dock(board).getByRole('link')).toHaveCount(5);
  await expect(section(board, 'Work')).toHaveCount(0);
  await expect(board.locator('footer')).toHaveCount(0);
  await expect(board.locator('html')).toHaveCSS('scrollbar-gutter', 'auto');
  const first = dock(board).getByRole('link').first();
  const face = first.locator('.dock-face');
  await first.hover();
  await expect.poll(() => face.evaluate((node) => {
    return new DOMMatrix(getComputedStyle(node).transform).a;
  })).toBeGreaterThan(1.2);
  await board.emulateMedia({ reducedMotion: 'reduce' });
  await expect(face).toHaveCSS('transform', 'none');
  await board.setViewportSize({ width: 320, height: 600 });
  expect(await board.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('imports a Scene wallpaper locally, restores it after reload and removes it', async ({ board }) => {
  const sceneName = 'Scene test fixture';
  const config = Buffer.from(JSON.stringify({
    general: { orthogonalprojection: { width: 640, height: 360 }, clearcolor: '0.2 0.4 0.6' },
    objects: [],
  }));
  const entry = Buffer.from('scene.json');
  const header = Buffer.alloc(28 + entry.length);
  header.writeUInt32LE(8, 0);
  header.write('PKGV0012', 4);
  header.writeUInt32LE(1, 12);
  header.writeUInt32LE(entry.length, 16);
  entry.copy(header, 20);
  header.writeUInt32LE(config.length, 24 + entry.length);

  await board.getByRole('button', { name: '设置', exact: true }).click();
  await board.getByRole('button', { name: 'Scene 壁纸', exact: true }).click();
  const picker = board.locator('input[accept=".pkg,.json"]');
  await picker.setInputFiles({ name: 'invalid.pkg', mimeType: 'application/octet-stream', buffer: Buffer.from('invalid') });
  await expect(board.getByRole('alert')).toContainText('请选择有效的 Scene 文件');
  const canvas = board.locator('[data-scene-wallpaper] canvas');
  await expect(canvas).toHaveCount(0);

  await picker.setInputFiles([
    { name: 'scene.pkg', mimeType: 'application/octet-stream', buffer: Buffer.concat([header, config]) },
    { name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ title: sceneName, type: 'Scene' })) },
  ]);
  await expect(board.getByTitle(sceneName)).toBeVisible();
  await expect(canvas).toBeVisible();
  await board.reload();
  await expect(canvas).toBeVisible();
  await expect(board.getByText('无法播放这张 Scene 壁纸')).toHaveCount(0);

  await board.getByRole('button', { name: '设置', exact: true }).click();
  await board.getByRole('button', { name: '移除 Scene 壁纸' }).click();
  await expect(canvas).toHaveCount(0);
  await expect.poll(() => board.evaluate(async () => {
    const { settings } = await chrome.storage.local.get('settings');
    return (settings as { background?: { type: string } }).background?.type;
  })).toBe('none');
});

test('contains an uninterrupted bookmark title on narrow and wide screens', async ({ board }) => {
  const name = 'EngagementratecalculatorWithAnEvenLongerName';
  await board.evaluate(async (name) => {
    const { shortcuts } = await chrome.storage.local.get('shortcuts');
    await chrome.storage.local.set({ shortcuts: (shortcuts as import('../src/utils/types').Shortcut[])
      .map((shortcut) => shortcut.id === 'bravo' ? { ...shortcut, name } : shortcut) });
  }, name);
  for (const width of [390, 1280]) {
    await board.setViewportSize({ width, height: 720 });
    const card = link(board, 'Read', name);
    await expect(card).toBeVisible();
    const fits = await card.evaluate((element, name) => {
      const label = Array.from(element.querySelectorAll('span')).find((span) => span.textContent === name)!;
      return label.clientWidth <= element.clientWidth && label.scrollWidth <= label.clientWidth + 1
        && label.clientHeight <= 2 * parseFloat(getComputedStyle(label).lineHeight) + 1;
    }, name);
    expect(fits).toBe(true);
  }
});

test('keeps the wallpaper and scrolling stable while a bookmark menu is open', async ({ board }) => {
  await board.setViewportSize({ width: 1024, height: 460 });
  await board.evaluate(async (image) => {
    const { settings } = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({ settings: { ...settings, background: { type: 'image', imageUrl: image } } });
  }, 'data:image/png;base64,' + icon);
  const wallpaper = board.locator('#root > div > [aria-hidden="true"]').first();
  await expect(wallpaper).toHaveCSS('background-size', 'cover');
  expect(await board.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(460);
  const rect = await wallpaper.boundingBox();
  const bookMenu = section(board, 'Work').getByRole('button', { name: '「Alpha」的操作' });
  await bookMenu.click();
  await expect(board.getByRole('menuitem', { name: '固定到 Dock' })).toBeVisible();
  await expect(board.locator('body[data-scroll-locked]')).toHaveCount(0);
  expect(await wallpaper.boundingBox()).toEqual(rect);
  await board.keyboard.press('Escape');
  await expect(bookMenu).toBeFocused();
  expect(await wallpaper.boundingBox()).toEqual(rect);

  await bookMenu.click();
  await board.getByRole('menuitem', { name: '编辑', exact: true }).click();
  await expect(board.getByRole('dialog', { name: '编辑快捷方式' })).toBeVisible();
  expect(await wallpaper.boundingBox()).toEqual(rect);
});

async function drag(page: Page, source: Locator, target: Locator) {
  const start = await source.boundingBox();
  const end = await target.boundingBox();
  if (!start || !end) throw new Error('Drag source or target is hidden');
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 14 });
  await page.mouse.up();
}

test('drags between groups, reorders within a group, drops into collapsed and ungrouped sections, and persists', async ({ board }) => {
  await drag(board, section(board, 'Work').getByRole('button', { name: '拖动「Alpha」', exact: true }), link(board, 'Read', 'Charlie'));
  await expect(link(board, 'Work', 'Alpha')).toHaveCount(0);
  await expect(section(board, 'Read').getByRole('link')).toHaveText(['Bravo', 'Alpha', 'Charlie']);

  await drag(board, section(board, 'Read').getByRole('button', { name: '拖动「Charlie」', exact: true }), link(board, 'Read', 'Bravo'));
  await expect(section(board, 'Read').getByRole('link')).toHaveText(['Charlie', 'Bravo', 'Alpha']);

  await drag(board, section(board, 'Read').getByRole('button', { name: '拖动「Alpha」', exact: true }), section(board, 'Empty'));
  await expect(link(board, 'Read', 'Alpha')).toHaveCount(0);
  await section(board, 'Empty').getByRole('button', { name: 'Empty (1)' }).click();
  await expect(link(board, 'Empty', 'Alpha')).toBeVisible();

  await drag(board, section(board, 'Empty').getByRole('button', { name: '拖动「Alpha」', exact: true }),
    section(board, '未分组').getByRole('heading'));
  await expect(link(board, '未分组', 'Alpha')).toBeVisible();
  await expect(link(board, 'Empty', 'Alpha')).toHaveCount(0);

  await expect.poll(() => board.evaluate(async () => {
    const { groups } = await chrome.storage.local.get('groups');
    return (groups as { id: string; shortcutIds: string[] }[]).find((group) => group.id === 'read')?.shortcutIds;
  })).toEqual(['charlie', 'bravo']);
  await board.reload();
  await expect(link(board, '未分组', 'Alpha')).toBeVisible();
  await expect(section(board, 'Read').getByRole('link')).toHaveText(['Charlie', 'Bravo']);
  await expect(board.locator('footer')).toContainText('序言');
});

test('keeps Dock pins independent while importing and exporting the legacy backup format', async ({ board }) => {
  await expect(link(board, '未分组', 'Legacy pin')).toBeVisible();

  await section(board, 'Read').getByRole('button', { name: '「Bravo」的操作' }).click();
  await board.getByRole('menuitem', { name: '固定到 Dock', exact: true }).click();
  await expect(link(board, 'Read', 'Bravo')).toBeVisible();
  await switchLayout(board, '底部 Dock');
  await expect(section(board, 'Read')).toHaveCount(0);
  await expect(dock(board).getByRole('link')).toHaveCount(2);
  await dock(board).getByRole('button', { name: '「Bravo」的操作' }).click();
  await board.getByRole('menuitem', { name: '向左移动' }).click();
  await expect(dock(board).getByRole('link').first()).toHaveAccessibleName('Bravo');
  await dock(board).getByRole('button', { name: '「Bravo」的操作' }).click();
  await board.getByRole('menuitem', { name: '从 Dock 取消固定' }).click();
  await expect(dock(board).getByRole('link', { name: 'Bravo' })).toHaveCount(0);

  await board.getByRole('button', { name: '导入导出', exact: true }).click();
  const dialog = board.getByRole('dialog', { name: '导入导出书签' });
  const backup = {
    version: '1.0', exportedAt: 1,
    shortcuts: [{ ...shortcuts[2], id: 'old-bravo' }],
    groups: [{ ...groups[3], shortcutIds: ['old-bravo'] }],
  };
  await dialog.locator('input[type=file]').setInputFiles({
    name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)),
  });
  await dialog.getByRole('button', { name: '确认导入' }).click();
  await expect(dock(board).getByRole('link', { name: 'Bravo' })).toBeVisible();
  await board.getByRole('button', { name: '导入导出', exact: true }).click();
  const [download] = await Promise.all([
    board.waitForEvent('download'),
    dialog.getByRole('button', { name: '导出', exact: true }).click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(data.groups.filter((group: { id: string }) => group.id === 'sys-dock')).toEqual([
    expect.objectContaining({ shortcutIds: ['legacy', 'bravo'] }),
  ]);
  await switchLayout(board, '分组');
  await expect(link(board, 'Read', 'Bravo')).toBeVisible();
});

test('reads cached icons and failed lookups locally on subsequent tabs', async ({ board, worker }) => {
  const calls = () => worker.evaluate(() => (globalThis as typeof globalThis & {
    bookmarkFaviconMock: { calls: string[] };
  }).bookmarkFaviconMock.calls);

  const cached = link(board, 'Work', 'Alpha').locator('img');
  const fresh = link(board, 'Read', 'Bravo').locator('img');
  await expect(cached).toHaveAttribute('src', 'data:image/png;base64,' + icon);
  await expect(fresh).toHaveAttribute('src', 'data:image/png;base64,' + icon);
  await expect.poll(async () => (await calls()).filter((url) => url.includes('missing.test')).length).toBe(3);
  await expect.poll(() => board.evaluate(async () => new Promise<boolean>((resolve) => {
    const request = indexedDB.open('favicon-cache', 1);
    request.onsuccess = () => {
      const db = request.result;
      const get = db.transaction('favicons').objectStore('favicons').get('missing.test');
      get.onsuccess = () => { db.close(); resolve(get.result?.base64 === null); };
    };
  }))).toBe(true);
  const initial = await calls();
  expect(initial.filter((url) => url.includes('fresh.test'))).toHaveLength(2);
  expect(initial.some((url) => url.includes('cached.test'))).toBe(false);
  await expect(link(board, 'Work', 'Extra bookmark').locator('img')).toHaveCount(0);

  const second = await board.context().newPage();
  await second.goto(board.url());
  await expect(link(second, 'Read', 'Bravo').locator('img')).toHaveAttribute('src', 'data:image/png;base64,' + icon);
  await expect(link(second, 'Work', 'Extra bookmark')).toContainText('E');
  expect(await calls()).toEqual(initial);
});

test('keeps keyboard ordering, batch copy, quick add and Chrome bookmark import available', async ({ board }) => {
  const bookmarkHandle = section(board, 'Read').getByRole('button', { name: '拖动「Bravo」', exact: true });
  const announcement = board.locator('[id^="DndLiveRegion"]');
  await bookmarkHandle.focus();
  // dnd-kit 在拿起后的下一个任务里安装方向键监听。
  await board.keyboard.press('Space', { delay: 120 });
  await expect(bookmarkHandle).toHaveAttribute('aria-pressed', 'true');
  await expect(announcement).toHaveText('当前落点为「Bravo」');
  await board.keyboard.press('ArrowRight');
  await expect(link(board, 'Read', 'Charlie').locator('../..')).toHaveClass(/ring-primary/);
  await board.keyboard.press('Space');
  await expect(section(board, 'Read').getByRole('link')).toHaveText(['Charlie', 'Bravo']);

  const groupHandle = section(board, 'Work').getByRole('button', { name: '拖动「Work」分组', exact: true });
  await groupHandle.focus();
  await board.keyboard.press('Space', { delay: 120 });
  await expect(groupHandle).toHaveAttribute('aria-pressed', 'true');
  await expect(announcement).toHaveText('当前落点为「Work」');
  await board.keyboard.press('ArrowDown');
  await expect(announcement).toHaveText('当前落点为「Read」');
  await board.keyboard.press('Space');
  await expect(board.getByRole('region').first()).toHaveAccessibleName('Read');

  const read = section(board, 'Read');
  await read.getByRole('button', { name: '批量管理' }).click();
  await read.getByRole('button', { name: 'Bravo', exact: true }).click();
  await read.getByRole('button', { name: '迁移', exact: true }).click();
  const migration = board.getByRole('dialog');
  await migration.getByRole('button', { name: '复制', exact: true }).click();
  await migration.getByRole('button', { name: /^Work/ }).click();
  await expect(link(board, 'Read', 'Bravo')).toBeVisible();
  await expect(link(board, 'Work', 'Bravo')).toBeVisible();

  await read.getByRole('button', { name: '添加快捷方式', exact: true }).click();
  const quickAdd = board.getByRole('dialog', { name: '添加快捷方式' });
  await quickAdd.getByPlaceholder('粘贴网址…').fill('https://quick.test');
  await quickAdd.getByPlaceholder('名称', { exact: true }).fill('Quick bookmark');
  await quickAdd.getByRole('button', { name: '添加', exact: true }).click();
  await expect(link(board, 'Read', 'Quick bookmark')).toBeVisible();

  await board.evaluate(() => chrome.bookmarks.create({ title: 'Chrome bookmark', url: 'https://imported.test' }));
  await board.getByRole('button', { name: '操作', exact: true }).click();
  await board.getByRole('menuitem', { name: '从 Chrome 书签导入' }).click();
  await expect(link(board, '未分组', 'Chrome bookmark')).toBeVisible();
});
