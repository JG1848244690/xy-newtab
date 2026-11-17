# 隐私政策 / Privacy Policy

适用扩展:新标签页（NewTab - Grouped Speed Dial & Wallpapers -xy）
Effective date / 生效日期:2026-11-17
Contact / 联系方式:privacy@kskbl.com.cn

---

## 中文

### 1. 我们处理哪些数据

**a. 你主动创建的快捷方式与分组**
名称、网址、图标、所属分组。这些数据默认只保存在你本机的浏览器扩展存储（`chrome.storage.local`）中。

**b. 你的设置与外观**
布局、主题、背景图片或视频、透明度等。背景图片与视频文件保存在本机 IndexedDB 中，**不会上传到我们的服务器**。

**c. Google 账号信息（仅在你选择登录时）**
你点击「登录」并通过 Google OAuth 授权后，我们会获得你的 Google 账号 ID、邮箱地址、昵称和头像地址。用途仅是识别你的账号，以便在你的多台设备之间同步快捷方式与分组。我们不会获取你的 Gmail 内容、联系人或任何其他 Google 服务数据。

**d. 登录凭证**
登录成功后，后端签发的会话令牌（session token）保存在本机扩展存储中，用于后续接口鉴权。

**e. 网站图标请求**
为显示快捷方式的图标，扩展会向你添加的网址所在域名请求图标，请求会发往 Google（`google.com/s2/favicons`）、DuckDuckGo（`icons.duckduckgo.com`）或 icon.horse（`icon.horse`）。这些第三方会收到该域名。图标缓存在本机 IndexedDB 中。

**f. 我们不做的事**
不收集浏览历史，不记录你的搜索内容，不投放广告，不接入统计分析或指纹识别 SDK，不出售或与第三方共享任何用户数据。

### 2. 云同步（可选）

云同步默认关闭。仅当你主动登录 Google 账号并点击「上传到云端」时，扩展才会把**快捷方式与分组**（名称、网址、图标、分组结构）上传到我们的服务器（`kskbl.com.cn`）。你在其他设备登录后点击「从云端下载」即可获取。你可以随时退出登录并停止使用该功能。

云端数据在我们服务器上保留至你删除它或要求我们删除。你可以通过下方联系方式请求导出或删除你的云端数据。

### 3. 数据用途

我们仅将上述数据用于提供扩展本身的功能:显示你的快捷方式与分组、在你的设备间同步、以及维护登录状态。**不会**用于广告、画像、信贷、保险或任何与功能无关的目的。这符合 Chrome 应用商店「有限使用（Limited Use）」要求。

### 4. 数据存储与安全

- 本地数据保存在你的浏览器中，卸载扩展即被移除。
- 云端数据保存在我们位于中国境内的服务器上，通过 HTTPS 传输，访问需持有你本人的登录令牌。
- 我们会尽量减少服务器日志，仅保留运行与安全所必需的最少信息。

### 5. 第三方服务

| 服务 | 用途 | 涉及数据 |
| --- | --- | --- |
| Google OAuth | 登录鉴权 | 账号 ID、邮箱、昵称、头像 |
| Google / DuckDuckGo / icon.horse | 获取网站图标 | 你添加的网址的域名 |
| kskbl.com.cn（我们的服务器） | 可选的云同步 | 快捷方式与分组 |

各第三方对其自身服务的数据处理适用其各自的隐私政策。

### 6. 儿童

本扩展不面向 13 岁以下儿童，我们不会故意收集儿童的个人信息。

### 7. 政策更新

本文档如有变更，我们会更新本页顶部的生效日期。涉及数据使用方式的重要变更，会在扩展内提示。

### 8. 联系我们

隐私相关问题、数据导出或删除请求:privacy@kskbl.com.cn

---

## English

### 1. What we handle

**a. Shortcuts and groups you create.** Names, URLs, icons, and group membership. By default this data stays in your browser's extension storage (`chrome.storage.local`).

**b. Your settings and appearance.** Layout, theme, background image or video, opacity. Background images and videos are stored locally in IndexedDB and are **never uploaded to our servers**.

**c. Google account information (only if you sign in).** When you click Sign in and authorize through Google OAuth, we receive your Google account ID, email address, display name, and avatar URL. This is used solely to identify your account so your shortcuts and groups can sync across your devices. We do not access your Gmail, contacts, or any other Google service data.

**d. Login credential.** After a successful sign-in, a session token issued by our backend is stored in your browser's extension storage and used to authenticate API requests.

**e. Website icon requests.** To display shortcut icons, the extension requests icons for the domains you add, from Google (`google.com/s2/favicons`), DuckDuckGo (`icons.duckduckgo.com`), or icon.horse (`icon.horse`). Those third parties receive the domain name. Icons are cached locally in IndexedDB.

**f. What we do not do.** We do not collect your browsing history, we do not record what you search for, we show no ads, we ship no analytics or fingerprinting SDKs, and we never sell or share user data with third parties.

### 2. Cloud sync (optional)

Cloud sync is off by default. Only after you sign in with Google and click Upload to cloud does the extension send **your shortcuts and groups** (names, URLs, icons, group structure) to our server (`kskbl.com.cn`). Sign in on another device and click Download from cloud to retrieve them. You can sign out at any time and stop using the feature.

Cloud data is retained on our server until you delete it or ask us to. You may request an export or deletion of your cloud data using the contact below.

### 3. How we use data

We use the data above only to provide the extension's own functionality: showing your shortcuts and groups, syncing them across your devices, and keeping you signed in. We do **not** use it for advertising, profiling, credit, insurance, or any purpose unrelated to the feature. This is consistent with the Chrome Web Store Limited Use requirements.

### 4. Storage and security

- Local data lives in your browser and is removed when you uninstall the extension.
- Cloud data is stored on servers we operate in China, transferred over HTTPS, and accessible only with your own login token.
- We keep server logs to the minimum required for operation and security.

### 5. Third-party services

| Service | Purpose | Data involved |
| --- | --- | --- |
| Google OAuth | Sign-in | Account ID, email, name, avatar |
| Google / DuckDuckGo / icon.horse | Website icons | Domain of the site you added |
| kskbl.com.cn (our server) | Optional cloud sync | Shortcuts and groups |

Each third party handles data under its own privacy policy.

### 6. Children

The extension is not directed to children under 13, and we do not knowingly collect their personal information.

### 7. Changes

If this policy changes, we will update the effective date at the top of this page. Material changes to how data is used will be surfaced inside the extension.

### 8. Contact

Privacy questions, data export, or deletion requests: privacy@kskbl.com.cn
