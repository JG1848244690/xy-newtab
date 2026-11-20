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

test('switches layout from the toolbar and returns focus after the settings panel closes', async ({ board }) => {
  const toolbar = board.getByRole('group', { name: '操作', exact: true });
  await expect(toolbar.getByRole('button')).toHaveCount(4);
  await toolbar.getByRole('button', { name: '切换到底部 Dock' }).click();
  await expect(dock(board)).toBeVisible();
  await expect(section(board, 'Work')).toHaveCount(0);
  await board.reload();
  await expect(dock(board)).toBeVisible();
  await toolbar.getByRole('button', { name: '切换到分组布局' }).click();
  await expect(section(board, 'Work')).toBeVisible();

  const settings = toolbar.getByRole('button', { name: '设置', exact: true });
  await settings.click();
  const panel = board.getByRole('dialog', { name: '设置', exact: true });
  await expect(panel).toHaveCSS('animation-name', 'settings-enter');
  await board.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(settings).toBeFocused();
  await board.emulateMedia({ reducedMotion: 'reduce' });
  await settings.click();
  await expect(panel).toHaveCSS('animation-name', 'none');
});

test('switches task dates and manages tasks through the authorized website session', async ({ board, worker }) => {
  const origin = 'https://hls.kskbl.com.cn/*';
  expect(await worker.evaluate((origin) => chrome.permissions.contains({ origins: [origin] }), origin)).toBe(false);

  await worker.evaluate(() => {
    const originalFetch = globalThis.fetch;
    type Task = {
      id: string; content: string; startDate: string; endDate: string; startTime: string; endTime: string;
      allDay: boolean; completed: boolean; description?: string;
    };
    const task = (id: string, content: string, date: string, allDay = false, completed = false): Task => ({
      id, content, startDate: date, endDate: date, startTime: allDay ? '00:00:00' : '09:30:00',
      endTime: allDay ? '23:59:59' : '10:00:00', allDay, completed,
    });
    const fixture = {
      signedIn: false,
      requests: [] as { url: string; credentials?: string; method: string; body?: unknown }[],
      tasks: [
        task('00000000-0000-4000-8000-000000000001', 'Design review', '2026-11-30'),
        task('00000000-0000-4000-8000-000000000002', 'Send notes', '2026-11-30', true, true),
        task('00000000-0000-4000-8000-000000000003', 'Yesterday only', '2026-11-29'),
      ],
    };
    Object.assign(globalThis, { todayTodoFixture: fixture });
    Object.defineProperty(chrome.permissions, 'contains', { value: async () => {
      return Boolean((await chrome.storage.session.get('todoPermissionFixture')).todoPermissionFixture);
    } });
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (!url.startsWith('https://hls.kskbl.com.cn/')) return originalFetch(input, init);
      const { pathname, searchParams } = new URL(url);
      const method = init?.method ?? 'GET';
      const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
      fixture.requests.push({ url, credentials: init?.credentials, method, body });
      if (!fixture.signedIn) return new Response(null, { status: 401 });
      if (pathname === '/api-hls/todos/by-date' && method === 'GET') {
        const date = searchParams.get('date') ?? '';
        return Response.json(fixture.tasks.filter((item) => item.startDate <= date && item.endDate >= date));
      }
      if (pathname === '/api-hls/todos' && method === 'POST') {
        const created = { ...body, id: '00000000-0000-4000-8000-000000000004', completed: false };
        fixture.tasks.push(created);
        return Response.json(created);
      }
      const match = /^\/api-hls\/todos\/([^/]+)(\/toggle)?$/.exec(pathname);
      const current = fixture.tasks.find((item) => item.id === match?.[1]);
      if (!current) return new Response(null, { status: 404 });
      if (method === 'DELETE') {
        fixture.tasks = fixture.tasks.filter((item) => item.id !== current.id);
        return Response.json({ success: true });
      }
      if (method === 'PATCH' && match?.[2]) {
        current.completed = !current.completed;
        return Response.json({ id: current.id, completed: current.completed });
      }
      if (method === 'PATCH') return Response.json(Object.assign(current, body));
      return new Response(null, { status: 405 });
    };
  });
  await board.evaluate(() => {
    Object.defineProperty(chrome.permissions, 'request', { value: async () => {
      await chrome.storage.session.set({ todoPermissionFixture: true });
      return true;
    } });
    Object.defineProperty(chrome.permissions, 'remove', { value: async () => {
      await chrome.storage.session.remove('todoPermissionFixture');
      return true;
    } });
  });

  const requests = () => worker.evaluate(() => (globalThis as any).todayTodoFixture.requests);
  const localMidnight = await board.evaluate(() => new Date(2026, 10, 30, 0, 30).getTime());
  await board.clock.setFixedTime(localMidnight);
  expect(await requests()).toHaveLength(0);
  const trigger = board.getByRole('button', { name: '待办', exact: true });
  const panel = board.getByRole('dialog', { name: '待办', exact: true });
  await trigger.click();
  await expect(panel.getByRole('button', { name: '连接待办' })).toBeVisible();
  expect(await requests()).toHaveLength(0);

  await panel.getByRole('button', { name: '连接待办' }).click();
  await expect(panel.getByRole('link', { name: '前往系统登录' })).toHaveAttribute('href', 'https://hls.kskbl.com.cn/login');
  expect(await requests()).toEqual([{ url: 'https://hls.kskbl.com.cn/api-hls/todos/by-date?date=2026-11-30', credentials: 'include', method: 'GET', body: undefined }]);
  await worker.evaluate(() => { (globalThis as any).todayTodoFixture.signedIn = true; });
  await panel.getByRole('button', { name: '刷新待办' }).click();
  await expect(panel.getByText('Design review')).toBeVisible();
  await expect(panel.getByText('09:30 – 10:00')).toBeVisible();
  await expect(panel.getByText('Send notes')).toBeHidden();
  const completed = panel.getByText('已完成（1）', { exact: true });
  await completed.click();
  await expect(panel.getByText('Send notes')).toBeVisible();
  await expect(panel.getByText('全天')).toBeVisible();
  await completed.click();
  await expect(panel.getByText('Send notes')).toBeHidden();
  await expect(panel.getByRole('heading', { name: '待办', exact: true })).toBeVisible();
  await expect(panel.getByText('Design review')).toBeVisible();
  await completed.press('Enter');
  await expect(panel.getByText('Send notes')).toBeVisible();

  await panel.getByText('昨天', { exact: true }).click();
  await expect(panel.getByText('Yesterday only')).toBeVisible();
  await expect(panel.getByText('Design review')).toHaveCount(0);
  await panel.getByText('明天', { exact: true }).click();
  await expect(panel.getByText('这一天没有待办。')).toBeVisible();
  await panel.getByRole('button', { name: '新建待办' }).click();
  const editor = panel.getByRole('form', { name: '新建待办' });
  await expect(editor.getByLabel('开始日期')).toHaveValue('2026-12-01');
  await editor.getByLabel('标题').fill('Cross-day task');
  await editor.getByLabel('结束日期').fill('2026-11-29');
  await editor.getByRole('button', { name: '保存待办' }).click();
  await expect(editor.getByRole('alert')).toHaveText('结束日期需等于或晚于开始日期。');
  await editor.getByLabel('开始日期').fill('2026-11-30');
  await editor.getByLabel('结束日期').fill('2026-12-01');
  await editor.getByRole('checkbox', { name: '全天' }).uncheck();
  await editor.getByLabel('开始时间').fill('22:00');
  await editor.getByLabel('结束时间').fill('09:00');
  await editor.getByLabel('备注（可选）').fill('Keep this note');
  await editor.getByRole('button', { name: '保存待办' }).click();
  await expect(panel.getByText('Cross-day task', { exact: true })).toBeVisible();
  await panel.getByText('今天', { exact: true }).click();
  await expect(panel.getByText('Cross-day task', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: '编辑「Cross-day task」' }).click();
  const edit = panel.getByRole('form', { name: '编辑待办' });
  await expect(edit.getByLabel('备注（可选）')).toHaveValue('Keep this note');
  await edit.getByLabel('标题').fill('Updated task');
  await edit.getByRole('button', { name: '保存待办' }).click();
  const toggle = panel.getByRole('button', { name: '完成状态「Updated task」' });
  await toggle.click();
  await panel.getByText('已完成（2）', { exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await panel.getByRole('button', { name: '删除「Updated task」' }).click();
  await expect(panel.getByText('确定删除「Updated task」？跨天待办会从所有日期移除。')).toBeVisible();
  await panel.getByRole('button', { name: '取消', exact: true }).click();
  await expect(panel.getByText('Updated task', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: '删除「Updated task」' }).click();
  await panel.getByRole('button', { name: '删除待办', exact: true }).click();
  await expect(panel.getByText('待办已删除。')).toBeVisible();
  await panel.getByText('明天', { exact: true }).click();
  await expect(panel.getByText('这一天没有待办。')).toBeVisible();

  const writes = (await requests()).filter(({ method }: { method: string }) => method !== 'GET');
  expect(writes.map(({ method }: { method: string }) => method)).toEqual(['POST', 'PATCH', 'PATCH', 'PATCH', 'DELETE']);
  expect(writes.every(({ credentials }: { credentials?: string }) => credentials === 'include')).toBe(true);
  expect(writes[0].body).toMatchObject({
    startDate: '2026-11-30', endDate: '2026-12-01', startTime: '22:00:00', endTime: '09:00:00', allDay: false,
  });

  const count = (await requests()).length;
  await panel.getByRole('button', { name: '断开连接' }).click();
  await expect(panel.getByRole('button', { name: '连接待办' })).toBeVisible();
  expect(await requests()).toHaveLength(count);
  await board.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(board.locator('.todo-panel')).toHaveCount(0);
});

test('enables weather after consent, validates the key and reuses the local forecast cache', async ({ board, worker }) => {
  await worker.evaluate(() => {
    const originalFetch = globalThis.fetch;
    const originalContains = chrome.permissions.contains.bind(chrome.permissions);
    const weatherOrigin = 'https://api.weatherapi.com/*';
    const calls: { city: string | null; language: string | null; credentials?: string }[] = [];
    Object.assign(globalThis, { weatherFixture: calls });
    Object.defineProperty(chrome.permissions, 'contains', {
      value: async (permission: chrome.permissions.Permissions) => permission.origins?.includes(weatherOrigin)
        ? Boolean((await chrome.storage.session.get('weatherAllowed')).weatherAllowed)
        : originalContains(permission),
    });
    globalThis.fetch = async (input, options) => {
      const url = new URL(String(input));
      if (url.origin !== 'https://api.weatherapi.com') return originalFetch(input, options);
      calls.push({ city: url.searchParams.get('q'), language: url.searchParams.get('lang'), credentials: options?.credentials });
      if ((await chrome.storage.session.get('weatherOffline')).weatherOffline) throw new TypeError('Offline fixture');
      if (url.searchParams.get('key') !== 'weather-fixture') return Response.json({ error: { code: 2006 } }, { status: 401 });
      return Response.json({
        location: { name: 'Beijing' },
        current: { temp_c: 17.4, feelslike_c: 15.1, is_day: 1, condition: { code: 1003, text: '局部多云' } },
        forecast: { forecastday: [{ day: { mintemp_c: 7, maxtemp_c: 19 } }] },
      });
    };
  });
  await board.addInitScript(() => {
    Object.defineProperty(chrome.permissions, 'request', {
      value: async (permission: chrome.permissions.Permissions) => {
        if (!permission.origins?.includes('https://api.weatherapi.com/*')) return false;
        await chrome.storage.session.set({ weatherAllowed: true });
        return true;
      },
    });
    Object.defineProperty(chrome.permissions, 'remove', {
      value: async () => {
        await chrome.storage.session.remove('weatherAllowed');
        return true;
      },
    });
  });
  await board.reload();
  const requests = () => worker.evaluate(() => Reflect.get(globalThis, 'weatherFixture'));
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  await expect(board.locator('.desktop-weather')).toHaveCount(0);
  expect(await requests()).toEqual([]);

  await board.getByRole('button', { name: '设置', exact: true }).click();
  const panel = board.getByRole('dialog', { name: '设置' });
  await panel.locator('summary').filter({ hasText: '天气' }).click();
  await panel.getByLabel('城市', { exact: true }).fill('Beijing');
  await panel.getByLabel('WeatherAPI.com API Key').fill('invalid-fixture');
  await panel.getByRole('button', { name: '保存天气设置' }).click();
  await expect(panel.getByRole('alert')).toContainText('拒绝了此 Key');
  await panel.getByLabel('WeatherAPI.com API Key').fill('weather-fixture');
  await panel.getByRole('button', { name: '保存天气设置' }).click();
  await expect(panel.getByRole('button', { name: '关闭天气' })).toBeVisible();
  await board.keyboard.press('Escape');
  const weather = board.locator('.desktop-weather');
  await expect(weather).toContainText('17°C');
  await expect(weather).toContainText('体感 15°C');
  await expect(weather).toContainText('7°C 至 19°C');
  await expect(weather.getByRole('link', { name: 'WeatherAPI.com' })).toBeVisible();
  await board.reload();
  await expect(weather).toContainText('Beijing · 局部多云');
  expect(await requests()).toEqual(Array(2).fill({ city: 'Beijing', language: 'zh', credentials: 'omit' }));

  await worker.evaluate(async () => {
    const { weatherCache } = await chrome.storage.local.get('weatherCache');
    await chrome.storage.local.set({ weatherCache: { ...weatherCache, fetchedAt: Date.now() - 31 * 60_000 } });
    await chrome.storage.session.set({ weatherOffline: true });
  });
  await board.reload();
  await expect(weather).toContainText('17°C');
  await expect(weather.getByRole('status')).toHaveText('上次获取的数据');
  expect(await requests()).toHaveLength(3);

  await board.getByRole('button', { name: '设置', exact: true }).click();
  await panel.locator('summary').filter({ hasText: '天气' }).click();
  await panel.getByRole('button', { name: '关闭天气' }).click();
  await expect(weather).toHaveCount(0);
  await expect.poll(() => board.evaluate(async () => (await chrome.storage.local.get('settings')).settings?.weather)).toBeUndefined();
});

test('follows the browser UI locale automatically and persists a language override', async ({ board }) => {
  await board.addInitScript(() => {
    chrome.i18n.getUILanguage = () => 'en-US';
  });
  await board.reload();
  await board.getByRole('button', { name: '设置', exact: true }).click();
  await board.getByRole('combobox', { name: '语言' }).click();
  await board.getByRole('option', { name: '跟随系统（English）' }).click();
  await expect(board.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await expect(board.locator('html')).toHaveAttribute('lang', 'en');
  await board.reload();
  await board.getByRole('button', { name: 'Settings', exact: true }).click();
  await board.getByRole('combobox', { name: 'Language' }).click();
  await board.getByRole('option', { name: '简体中文' }).click();
  await board.reload();
  await expect(board.getByRole('button', { name: '设置', exact: true })).toBeVisible();
  await expect(board.locator('html')).toHaveAttribute('lang', 'zh-CN');
});

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

test('keeps the Dock clear of the Windows taskbar at the bottom of a screen-filling window', async ({ board }) => {
  await board.setViewportSize({ width: 1200, height: 1000 });
  await board.addInitScript(() => {
    Object.defineProperties(window.screen, {
      width: { value: 1200 },
      height: { value: 1000 },
      availHeight: { value: 1000, configurable: true },
      availTop: { value: 0, configurable: true },
    });
    Object.defineProperties(window, {
      outerWidth: { value: 1200 },
      outerHeight: { value: 1000, configurable: true },
      screenY: { value: 0 },
    });
    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Windows NT 10.0)' });
  });
  await board.reload();
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();

  const dockGap = () => dock(board).evaluate((element) => innerHeight - element.getBoundingClientRect().bottom);
  const desktopGap = () => board.locator('.desktop').evaluate((element) => innerHeight - element.getBoundingClientRect().bottom);
  const baseGap = 20;
  const taskbarHeight = 48;
  await expect.poll(dockGap).toBe(baseGap + taskbarHeight);
  await expect.poll(desktopGap).toBe(108 + taskbarHeight);

  await board.setViewportSize({ width: 1440, height: 1200 });
  await expect.poll(dockGap).toBe(baseGap + Math.ceil(taskbarHeight * 1.2));
  await board.setViewportSize({ width: 1200, height: 1000 });

  await board.evaluate(() => {
    Object.defineProperty(screen, 'availHeight', { value: 952 });
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(dockGap).toBe(baseGap + taskbarHeight);

  await board.evaluate(() => {
    Object.defineProperty(screen, 'availTop', { value: 48 });
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(dockGap).toBe(baseGap);

  await board.evaluate(() => {
    Object.defineProperty(screen, 'availTop', { value: 0 });
    Object.defineProperty(window, 'outerHeight', { value: 952 });
  });
  await board.setViewportSize({ width: 1200, height: 864 });
  await expect.poll(dockGap).toBe(baseGap);
  await expect.poll(desktopGap).toBe(108);
});

test('shows the local clock in Dock and updates the date across midnight', async ({ board }) => {
  await board.clock.install({ time: new Date(2026, 10, 19, 23, 59, 57) });
  const clock = board.locator('.desktop-clock');
  const digits = clock.locator('time > [aria-hidden="true"]').first();
  await expect(clock).toHaveCount(0);
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  await expect(digits).toHaveText('23:59');
  await expect(clock.locator('.desktop-clock-date')).toContainText('11月19日');
  await board.clock.fastForward(3100);
  await expect(digits).toHaveText('00:00');
  await expect(clock.locator('.desktop-clock-date')).toContainText('11月20日');
  await board.getByRole('button', { name: '切换到分组布局' }).click();
  await expect(clock).toHaveCount(0);
});

test('plays a local SceneScript with pointer input in the wallpaper sandbox', async ({ board }) => {
  const sceneName = 'Scene test fixture';
  const config = Buffer.from(JSON.stringify({
    general: {
      orthogonalprojection: { width: 640, height: 360 },
      clearcolor: '0.2 0.4 0.6',
      zoom: {
        value: 1,
        script: 'export function update(value) { return input.cursorScreenPosition.x > 400 ? 2 : 1; }',
      },
    },
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
  const scene = board.locator('iframe[data-scene-wallpaper]');
  const canvas = scene.contentFrame().locator('canvas');
  await expect(scene).toHaveCount(0);

  await picker.setInputFiles([
    { name: 'scene.pkg', mimeType: 'application/octet-stream', buffer: Buffer.concat([header, config]) },
    { name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ title: sceneName, type: 'Scene' })) },
  ]);
  await expect(board.getByTitle(sceneName)).toBeVisible();
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate(() => ({ origin: window.origin, runtimeId: globalThis.chrome?.runtime?.id })))
    .toEqual({ origin: 'null', runtimeId: undefined });
  expect(await scene.evaluate((frame: HTMLIFrameElement) => frame.contentDocument)).toBeNull();
  expect(await canvas.evaluate(() => new Promise<string>((resolve) => {
    document.addEventListener('securitypolicyviolation', (event) => resolve(event.effectiveDirective), { once: true });
    void fetch('https://scene-sandbox.test/').catch(() => {});
  }))).toBe('connect-src');

  const zoom = () => canvas.evaluate(() => {
    const sceneWindow = window as Window & { __scene?: { cameraTransforms: { zoom: number } } };
    return sceneWindow.__scene?.cameraTransforms.zoom;
  });
  await board.mouse.move(200, 100);
  await expect.poll(zoom).toBe(1);
  await board.mouse.move(800, 100);
  await expect.poll(zoom).toBe(2);
  await board.reload();
  await expect(canvas).toBeVisible();
  await expect(board.getByText('无法播放这张 Scene 壁纸')).toHaveCount(0);

  await board.getByRole('button', { name: '设置', exact: true }).click();
  await board.getByRole('button', { name: '移除 Scene 壁纸' }).click();
  await expect(scene).toHaveCount(0);
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

test('pages the Dock desktop one screen per wheel gesture and supports keyboard navigation', async ({ board, worker }) => {
  await board.setViewportSize({ width: 760, height: 600 });
  await worker.evaluate(async (seed) => {
    await chrome.storage.local.set({ shortcuts: Array.from({ length: 72 }, (_, index) => ({
      ...seed, id: `desktop-${index}`, name: `Desktop bookmark ${index + 1}`,
    })) });
  }, shortcuts[0]);
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();

  const track = board.locator('.desktop-track');
  const pager = board.getByRole('navigation', { name: '桌面分页' });
  const current = pager.locator('[aria-current="page"]');
  await expect(current).toHaveAccessibleName(/^第 1 页/);
  await track.hover();
  await board.mouse.wheel(0, 120);
  await track.evaluate((element) => {
    for (let repeat = 0; repeat < 12; repeat++) {
      element.dispatchEvent(new WheelEvent('wheel', { deltaY: 20, bubbles: true, cancelable: true }));
    }
  });
  await expect(current).toHaveAccessibleName(/^第 2 页/);
  await expect.poll(() => track.evaluate((element) => Math.round(element.scrollLeft / element.clientWidth))).toBe(1);
  await track.focus();
  await board.keyboard.press('ArrowRight');
  await expect(current).toHaveAccessibleName(/^第 3 页/);
  await expect.poll(() => track.evaluate((element) => Math.round(element.scrollLeft / element.clientWidth))).toBe(2);

  await board.emulateMedia({ reducedMotion: 'reduce' });
  await expect(track).toHaveCSS('scroll-behavior', 'auto');
  await pager.getByRole('button', { name: /^第 1 页/ }).click();
  await expect(current).toHaveAccessibleName(/^第 1 页/);
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBe(0);
});

test('pins desktop shortcuts by dropping on Dock while retaining the desktop and group entries', async ({ board }) => {
  const switcher = board.getByRole('button', { name: '切换到底部 Dock' });
  await switcher.click();
  const desktop = board.getByRole('main', { name: '书签桌面' });
  const alpha = desktop.getByRole('link', { name: 'Alpha', exact: true });
  const dockAlpha = dock(board).getByRole('link', { name: 'Alpha', exact: true });

  await drag(board, alpha, dock(board).locator('.dock-shelf'));
  await expect(dockAlpha).toBeVisible();
  await expect(alpha).toBeVisible();
  await drag(board, alpha, dock(board).locator('.dock-shelf'));
  await expect(dockAlpha).toHaveCount(1);
  await board.reload();
  await expect(dockAlpha).toBeVisible();
  const edit = desktop.getByRole('button', { name: '编辑「Alpha」', exact: true });
  await expect(alpha.locator('..').getByRole('button')).toHaveCount(1);
  await alpha.hover();
  await edit.click();
  const editor = board.getByRole('dialog', { name: '编辑快捷方式' });
  await editor.locator('#name').fill('Updated Alpha');
  await editor.locator('#url').fill('https://cached.test/updated');
  await editor.getByRole('checkbox', { name: '固定到底部 Dock' }).uncheck();
  await editor.getByRole('button', { name: '保存', exact: true }).click();
  await expect(dockAlpha).toHaveCount(0);
  await expect(desktop.getByRole('link', { name: 'Updated Alpha', exact: true })).toHaveAttribute('href', 'https://cached.test/updated');
  await dock(board).getByRole('button', { name: '「Legacy pin」的操作' }).click();
  await board.getByRole('menuitem', { name: '编辑', exact: true }).click();
  await expect(editor.locator('#name')).toHaveValue('Legacy pin');
  await editor.getByRole('button', { name: '取消', exact: true }).click();
  await board.getByRole('button', { name: '切换到分组布局' }).click();
  await expect(link(board, 'Work', 'Updated Alpha')).toBeVisible();
});

test('reorders desktop bookmarks without changing groups or pins', async ({ board }) => {
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  const desktop = board.getByRole('main', { name: '书签桌面' });
  const tile = (name: string) => desktop.getByRole('link', { name, exact: true });

  await drag(board, tile('Alpha'), tile('Bravo'));
  await expect(desktop.locator('.desktop-label')).toHaveText(['Extra bookmark', 'Bravo', 'Alpha', 'Charlie', 'Legacy pin']);
  await drag(board, tile('Alpha'), desktop.locator('.desktop-clock-time'));
  await expect(desktop.getByRole('link').nth(2)).toHaveText('Alpha');
  await expect(dock(board).getByRole('link')).toHaveCount(1);
  await expect(dock(board).getByRole('link')).toHaveAccessibleName('Legacy pin');
  await board.reload();
  await expect(desktop.getByRole('link').nth(2)).toHaveText('Alpha');
  await board.getByRole('button', { name: '切换到分组布局' }).click();
  await expect(section(board, 'Work').getByRole('link').nth(0)).toHaveAccessibleName('Alpha');
  await expect(section(board, 'Work').getByRole('link').nth(1)).toHaveAccessibleName('Extra bookmark');
});

test('keeps all three rows fully inside the desktop scroll viewport', async ({ board, worker }) => {
  await board.setViewportSize({ width: 2048, height: 1088 });
  await worker.evaluate(async (seed) => {
    await chrome.storage.local.set({ shortcuts: Array.from({ length: 24 }, (_, index) => ({
      ...seed, id: `wide-${index}`, name: `Bookmark ${index + 1} with a long title that wraps`,
    })) });
  }, shortcuts[0]);
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  const track = board.locator('.desktop-track');
  await expect(track.locator('.desktop-page').first().locator('.desktop-tile')).toHaveCount(24);

  await expect.poll(() => track.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const firstIcon = element.querySelector('.desktop-icon')!.getBoundingClientRect();
    const lastLabel = Array.from(element.querySelectorAll('.desktop-label')).at(-1)!.getBoundingClientRect();
    return Math.min(firstIcon.top - bounds.top, bounds.bottom - lastLabel.bottom);
  })).toBeGreaterThanOrEqual(4);
});

test('filters only desktop bookmarks by name or address', async ({ board }) => {
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  const desktop = board.getByRole('main', { name: '书签桌面' });
  const search = desktop.getByRole('searchbox', { name: '搜索桌面书签' });
  for (const { width, height, gap } of [
    { width: 1280, height: 800, gap: 24 },
    { width: 390, height: 430, gap: 12 },
  ]) {
    await board.setViewportSize({ width, height });
    await expect.poll(() => desktop.evaluate((node) => {
      const searchBox = node.querySelector('.desktop-search')!.getBoundingClientRect();
      const firstIcon = node.querySelector('.desktop-icon')!.getBoundingClientRect();
      return firstIcon.top - searchBox.bottom;
    })).toBeGreaterThanOrEqual(gap);
  }
  await board.setViewportSize({ width: 1280, height: 800 });
  await search.fill('bravo');
  await expect(desktop.locator('.desktop-label')).toHaveText(['Bravo']);
  await search.fill('fresh.test/second');
  await expect(desktop.locator('.desktop-label')).toHaveText(['Charlie']);
  await expect(dock(board).getByRole('link')).toHaveAccessibleName('Legacy pin');
  await search.fill('no matching bookmark');
  await expect(desktop.getByText('无匹配结果', { exact: true })).toBeVisible();
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(desktop.locator('.desktop-label')).toHaveCount(5);
});

test('removes a desktop tile without deleting its library bookmark or pin, and restores it from groups', async ({ board }) => {
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  const desktop = board.getByRole('main', { name: '书签桌面' });
  const alpha = desktop.getByRole('link', { name: 'Alpha', exact: true });
  await drag(board, alpha, dock(board).locator('.dock-shelf'));
  const pinnedAlpha = dock(board).getByRole('link', { name: 'Alpha', exact: true });
  await expect(pinnedAlpha).toBeVisible();
  await alpha.hover();
  const edit = desktop.getByRole('button', { name: '编辑「Alpha」' });
  await expect(edit).toHaveCSS('opacity', '1');
  await edit.click();
  const editor = board.getByRole('dialog', { name: '编辑快捷方式' });
  await editor.getByRole('button', { name: '从 Dock 桌面移除' }).click();
  await expect(alpha).toHaveCount(0);
  await expect(pinnedAlpha).toBeVisible();
  await board.reload();
  await expect(pinnedAlpha).toBeVisible();
  await expect(alpha).toHaveCount(0);

  await board.getByRole('button', { name: '切换到分组布局' }).click();
  await expect(link(board, 'Work', 'Alpha')).toBeVisible();
  await section(board, 'Work').getByRole('button', { name: '「Alpha」的操作' }).click();
  await board.getByRole('menuitem', { name: '编辑', exact: true }).click();
  await editor.getByRole('button', { name: '恢复到 Dock 桌面' }).click();
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  await expect(alpha).toBeVisible();
});

test('drops on page markers, hovers to place a bookmark on another page, and supports keyboard moves', async ({ board, worker }) => {
  await board.setViewportSize({ width: 760, height: 650 });
  await board.emulateMedia({ reducedMotion: 'reduce' });
  await worker.evaluate(async (seed) => {
    await chrome.storage.local.set({ shortcuts: Array.from({ length: 27 }, (_, index) => ({
      ...seed, id: `move-${index}`, name: `Bookmark ${index + 1}`,
    })) });
  }, shortcuts[0]);
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  const desktop = board.getByRole('main', { name: '书签桌面' });
  const slides = desktop.locator('.desktop-page');
  const button = (n: number) => desktop.getByRole('button', { name: new RegExp(`^第 ${n} 页`) });
  const position = desktop.locator('.desktop-track');
  const visiblePage = () => position.evaluate((node) => Math.round(node.scrollLeft / node.clientWidth));
  const bookmark = desktop.getByRole('link', { name: 'Bookmark 1', exact: true });

  await drag(board, bookmark, button(2));
  await expect(button(2)).toHaveAttribute('aria-current', 'page');
  await expect(slides.nth(1).getByRole('link').first()).toHaveText('Bookmark 1');
  await expect.poll(visiblePage).toBe(1);

  const start = (await bookmark.boundingBox())!;
  const marker = (await button(1).boundingBox())!;
  await board.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await board.mouse.down();
  await board.mouse.move(marker.x + marker.width / 2, marker.y + marker.height / 2, { steps: 14 });
  await expect.poll(visiblePage).toBe(0);
  const target = (await slides.first().getByRole('link', { name: 'Bookmark 3', exact: true }).boundingBox())!;
  await board.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 14 });
  await board.mouse.up();
  await expect(slides.first().getByRole('link').nth(1)).toHaveText('Bookmark 1');

  const handle = bookmark;
  await handle.focus();
  await board.keyboard.press('Space', { delay: 120 });
  await expect(handle.locator('..')).toHaveAttribute('data-dragging', 'true');
  const announcement = board.locator('[id^="DndLiveRegion"]');
  await expect(announcement).toHaveText('当前落点为「Bookmark 1」');
  await board.keyboard.press('ArrowRight');
  await expect(announcement).toHaveText('当前落点为「Bookmark 3」');
  await board.keyboard.press('Space');
  await expect(slides.first().getByRole('link').nth(2)).toHaveText('Bookmark 1');
  await expect(handle).toBeFocused();
  await board.keyboard.press('Alt+PageDown');
  await expect(slides.nth(1).getByRole('link').first()).toHaveText('Bookmark 1');
  await expect(handle).toBeFocused();
  await expect.poll(visiblePage).toBe(1);
  await board.reload();
  await expect(slides.nth(1).getByRole('link').first()).toHaveText('Bookmark 1');
});

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
  expect(data.layouts).toMatchObject({ active: 'dock', dock: { pinnedIds: ['legacy', 'bravo'] } });
  await switchLayout(board, '分组');
  await expect(link(board, 'Read', 'Bravo')).toBeVisible();
});

test('restores both layouts, including explicit empty Dock pins, from a version 2 backup', async ({ board }) => {
  const backup = {
    version: '2.0', exportedAt: 1, shortcuts, groups,
    layouts: {
      active: 'dock',
      group: { iconsPerRow: 6 },
      dock: { pinnedIds: [], desktopOrder: ['charlie', 'legacy', 'alpha'], hiddenIds: ['bravo'] },
    },
  };
  await board.getByRole('button', { name: '导入导出', exact: true }).click();
  const dialog = board.getByRole('dialog', { name: '导入导出书签' });
  await dialog.locator('input[type=file]').setInputFiles({
    name: 'both-layouts.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)),
  });
  await dialog.getByRole('button', { name: '替换', exact: true }).click();
  await dialog.getByRole('button', { name: '确认导入' }).click();
  await expect(dialog).toBeHidden();
  await board.reload();
  await expect(board.getByRole('main', { name: '书签桌面' }).getByRole('link').first()).toHaveText('Charlie');
  await expect(board.getByRole('main', { name: '书签桌面' }).getByRole('link', { name: 'Bravo' })).toHaveCount(0);
  await expect(dock(board).getByRole('link')).toHaveCount(0);
  await expect.poll(() => board.evaluate(async () => (await chrome.storage.local.get('settings')).settings.iconsPerRow)).toBe(6);
  await switchLayout(board, '分组');
  await expect(section(board, 'Read').getByRole('link')).toHaveText(['Bravo', 'Charlie']);
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

  await board.evaluate(async () => {
    const folder = await chrome.bookmarks.create({ title: 'Import fixture' });
    await chrome.bookmarks.create({ parentId: folder.id, title: 'Chrome bookmark', url: 'https://imported.test' });
    await chrome.bookmarks.create({ parentId: folder.id, title: 'Keep in Chrome', url: 'https://skipped.test' });
  });
  await board.getByRole('button', { name: '操作', exact: true }).click();
  await board.getByRole('menuitem', { name: '从 Chrome 书签导入' }).click();
  const picker = board.getByRole('dialog', { name: '从 Chrome 书签导入' });
  await expect(picker.getByText(/Import fixture/)).toBeVisible();
  const confirm = picker.getByRole('button', { name: '确认导入' });
  await expect(confirm).toBeDisabled();
  await picker.getByRole('checkbox', { name: 'Chrome bookmark', exact: true }).check();
  await expect(picker.getByRole('checkbox', { name: '全选' })).toHaveJSProperty('indeterminate', true);
  const search = picker.getByRole('searchbox');
  await search.fill('SKIPPED.TEST');
  await expect(picker.getByRole('checkbox', { name: 'Chrome bookmark', exact: true })).toHaveCount(0);
  await picker.getByRole('checkbox', { name: '全选搜索结果' }).check();
  await picker.getByRole('checkbox', { name: '全选搜索结果' }).uncheck();
  await search.fill('Import fixture');
  await expect(picker.getByRole('checkbox', { name: 'Chrome bookmark', exact: true })).toBeChecked();
  await search.fill('nothing-to-insert');
  await expect(picker.getByText('没有符合搜索条件的书签')).toBeVisible();
  await expect(picker.getByRole('checkbox', { name: '全选搜索结果' })).toBeDisabled();
  await search.clear();
  await expect(board.locator('a[href="https://imported.test"]')).toHaveCount(0);
  await confirm.click();
  await expect(picker.getByRole('status')).toContainText('导入 1 个');
  await picker.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(link(board, '未分组', 'Chrome bookmark')).toBeVisible();
  await expect(link(board, '未分组', 'Keep in Chrome')).toHaveCount(0);
});

test('opens the Chrome picker from the toolbar and imports all only after confirmation', async ({ board, worker }) => {
  await board.setViewportSize({ width: 370, height: 520 });
  await board.evaluate(async () => {
    await chrome.bookmarks.create({ title: 'First Chrome bookmark', url: 'https://first-import.test' });
    await chrome.bookmarks.create({ title: 'Second Chrome bookmark', url: 'https://second-import.test' });
  });
  await board.getByRole('button', { name: '切换到底部 Dock' }).click();
  await board.getByRole('button', { name: '导入导出', exact: true }).click();
  const exportDialog = board.getByRole('dialog', { name: '导入导出书签' });
  const openPicker = exportDialog.getByRole('button', { name: '选择书签' });
  await openPicker.click();
  const picker = board.getByRole('dialog', { name: '从 Chrome 书签导入' });
  await expect(picker.getByRole('searchbox')).toBeVisible();
  const frame = await picker.boundingBox();
  expect(frame).not.toBeNull();
  expect(frame!.x).toBeGreaterThanOrEqual(0);
  expect(frame!.y + frame!.height).toBeLessThanOrEqual(520);
  await expect(picker.getByRole('button', { name: '确认导入' })).toBeInViewport();
  await picker.getByRole('checkbox', { name: '全选' }).check();
  await expect(picker.getByRole('checkbox', { name: 'First Chrome bookmark' })).toBeChecked();
  await picker.getByRole('button', { name: '取消', exact: true }).click();
  await expect(openPicker).toBeFocused();
  expect(await worker.evaluate(async () => (await chrome.storage.local.get('shortcuts')).shortcuts.length)).toBe(5);

  await openPicker.click();
  await expect(picker.getByRole('checkbox', { name: 'First Chrome bookmark' })).not.toBeChecked();
  await picker.getByRole('checkbox', { name: '全选' }).check();
  await picker.getByRole('button', { name: '确认导入' }).click();
  await expect(picker.getByRole('status')).toContainText('导入 2 个');
  await picker.getByRole('button', { name: '关闭', exact: true }).click();
  await exportDialog.getByRole('button', { name: '关闭', exact: true }).click();
  await board.setViewportSize({ width: 1280, height: 720 });
  const desktop = board.getByRole('main', { name: '书签桌面' });
  await expect(desktop.getByRole('link', { name: 'First Chrome bookmark' })).toBeVisible();
  await expect(desktop.getByRole('link', { name: 'Second Chrome bookmark' })).toBeVisible();
});
