# 隐私政策 / Privacy Policy

适用扩展:新标签页（NewTab - Grouped Speed Dial & Wallpapers -xy）
Effective date / 生效日期:2026-11-17
Contact / 联系方式:privacy@kskbl.com.cn
已发布 / Published:https://static.kskbl.com.cn/privacy/（源文件:`/www/wwwroot/static/privacy/index.html`）

**一句话:这个扩展不联网存数据。没有账号、没有云同步、没有后端服务器。**

**In one line: this extension stores nothing online — no account, no cloud sync, no backend server.**

---

## 中文

### 1. 我们如何处理数据

**a. 你创建的快捷方式与分组**
名称、网址、图标、所属分组,保存在你本机的浏览器扩展存储(`chrome.storage.local`)中。我们无法访问。

**b. 你的设置与外观**
布局、主题、背景颜色 / 图片 / 视频、透明度。背景图片与视频保存在本机 IndexedDB 中。我们无法访问。
你选择的 Wallpaper Engine Scene 包及其可选工程信息保存在本机 IndexedDB，并在新标签页本地渲染。

**c. 备份文件**
只有当你主动点击「导出」时,扩展才会在本地生成一个 JSON 文件交给你。文件保存在你自己选择的位置,不经过任何服务器。

**d. 从 Chrome 书签导入**
你点击「从 Chrome 书签导入」时,扩展通过浏览器提供的 `chrome.bookmarks` 接口读取本机书签树,直接写入本机存储。全程不联网。

### 2. 唯一的网络请求:网站图标

为显示快捷方式的图标,扩展会向你添加的网址所在**域名**请求图标,发往以下第三方之一:

| 服务 | 请求内容 |
| --- | --- |
| Google（`google.com/s2/favicons`） | 域名 |
| DuckDuckGo（`icons.duckduckgo.com`） | 域名 |
| icon.horse（`icon.horse`） | 域名 |

这些请求**只包含域名**,不包含你的账号、浏览历史或任何标识符。取回的图标缓存在本机 IndexedDB 中。若你不想产生这些请求,可以不添加快捷方式,或使用离线环境。

除此之外,扩展**不发起任何网络请求**:无统计、无遥测、无广告、无崩溃上报、无远程配置。

### 3. 我们不做的事

- 不收集浏览历史,不记录搜索内容(扩展本身没有搜索框)
- 不创建账号,不要求登录,不保存任何账号信息
- 不使用 Cookie、不接入分析或指纹识别 SDK
- 不出售、不出租、不与任何第三方共享用户数据
- 不使用远程代码:所有逻辑随扩展包一起分发

这符合 Chrome 应用商店的「有限使用（Limited Use）」要求。

### 4. 数据存储与删除

- 所有数据仅存在于你的浏览器中;卸载扩展即全部删除。
- 你也可以在扩展内删除单条快捷方式、分组,或通过「导出」先把数据备份成 JSON 再卸载。
- 删除背景视频 / 图片:在设置面板中更换或清空背景即可(文件随即从 IndexedDB 移除)。

### 5. 权限用途

| 权限 | 用途 |
| --- | --- |
| `storage` | 保存快捷方式、分组、设置 |
| `activeTab` | 你点击扩展图标时,读取**当前标签页**的网址与标题,用于「快捷添加」 |
| `bookmarks` | 你点击「从 Chrome 书签导入」时读取本机书签 |
| 网站图标域名 | 仅用于下载图标 |

### 6. 儿童

本扩展不面向 13 岁以下儿童,也不会有意收集其个人信息。

### 7. 政策更新

本文档如有变更,我们会更新本页顶部的生效日期。

### 8. 联系我们

隐私相关问题:privacy@kskbl.com.cn

---

## English

### 1. How data is handled

**a. Shortcuts and groups you create.** Names, URLs, icons, and group membership are stored in your browser's extension storage (`chrome.storage.local`). We cannot access them.

**b. Settings and appearance.** Layout, theme, background color / image / video, opacity. Background images and videos are stored in your browser's IndexedDB. We cannot access them.
Wallpaper Engine Scene packages and optional project metadata you select are stored in IndexedDB and rendered locally on the new tab page.

**c. Backup files.** Only when you click Export does the extension generate a JSON file locally for you. It is saved wherever you choose and never passes through a server.

**d. Importing Chrome bookmarks.** When you click Import from Chrome bookmarks, the extension reads your local bookmark tree through the browser's `chrome.bookmarks` API and writes it straight into local storage. No network involved.

### 2. The only network requests: website icons

To display shortcut icons, the extension requests an icon for the **domain** of each site you add, from one of these third parties:

| Service | What is sent |
| --- | --- |
| Google (`google.com/s2/favicons`) | the domain |
| DuckDuckGo (`icons.duckduckgo.com`) | the domain |
| icon.horse (`icon.horse`) | the domain |

Those requests contain **only the domain** — no account, no browsing history, no identifier. Returned icons are cached locally in IndexedDB. If you would rather avoid them, simply do not add shortcuts.

Otherwise the extension makes **no network requests at all**: no analytics, no telemetry, no ads, no crash reporting, no remote configuration.

### 3. What we do not do

- We do not collect your browsing history, and we do not record searches (the extension has no search box)
- We do not create accounts, require sign-in, or store any account information
- We use no cookies, no analytics SDKs, no fingerprinting
- We never sell, rent, or share user data with third parties
- We use no remote code: all logic ships inside the extension package

This is consistent with the Chrome Web Store Limited Use requirements.

### 4. Storage and deletion

- All data lives only in your browser; uninstalling the extension deletes everything.
- You can delete individual shortcuts or groups inside the extension, or export a JSON backup first.
- To remove a background video or image, change or clear the background in settings (the file is then removed from IndexedDB).

### 5. Why each permission is needed

| Permission | Purpose |
| --- | --- |
| `storage` | Save shortcuts, groups, settings |
| `activeTab` | When you click the extension icon, read the **current tab's** URL and title to prefill "Add shortcut" |
| `bookmarks` | Read local bookmarks when you click Import from Chrome bookmarks |
| favicon hosts | Download site icons only |

### 6. Children

The extension is not directed to children under 13, and we do not knowingly collect their personal information.

### 7. Changes

If this policy changes, we will update the effective date at the top of this page.

### 8. Contact

Privacy questions: privacy@kskbl.com.cn
