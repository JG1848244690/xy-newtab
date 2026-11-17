# Chrome Web Store Listing — NewTab - Grouped Speed Dial & Wallpapers -xy

> Last Updated: 2026-11-17

## Store Listing

**Extension Name** [REQUIRED]

NewTab - Grouped Speed Dial & Wallpapers -xy

<!-- 44 characters. Must match manifest.json "name" (rendered via __MSG_extName__). -->

**Short Description** [REQUIRED]

EN (129 / 132 chars):
Grouped Speed Dial for your new tab: bookmarks, drag and drop, custom wallpapers, video backgrounds. Offline, no account, no ads.

ZH (84 / 132 chars):
极简 Speed Dial 替换 Chrome 新标签页:分组书签、拖拽整理、自定义壁纸与视频背景。纯本地运行,无账号、无云端、无广告无追踪,也不修改你的默认搜索引擎。

<!-- Source of truth: public/_locales/{en,zh_CN}/messages.json → extDescription -->

**Detailed Description** [REQUIRED]

EN — full text in `public/_locales/en/description.txt` (plain text, CWS strips markdown):

```
Replace your Chrome new tab page with your own grouped bookmark shortcuts and wallpapers.

FEATURES

• Grouped shortcuts — create groups, give each one a name, icon and color, then drag sites between them.
• Two layouts — a grouped card layout for browsing, or a dock along the bottom edge.
• Wallpapers — solid colors, curated images, your own picture, or a local video that plays quietly behind your shortcuts.
• Fast adding — press Ctrl+Y (Cmd+Y on Mac) while on any page and the popup opens with the URL already filled in.
• Batch editing — select several shortcuts at once to move, copy or delete them.
• Light and dark themes, following your system or your choice.
• English and Chinese interface.

HOW TO USE

1. Install the extension and open a new tab — it replaces the default page.
2. Click the plus button inside a group, or press Ctrl+Y on any page to add the current site.
3. Drag shortcuts or groups to reorder them. Use the gear icon for layout, wallpaper and language.
4. Back up from Import / Export, or pull in your existing Chrome bookmarks with one click.

PRIVACY

No account, no sign-in, no cloud sync and no server of ours. Your shortcuts, groups, settings and wallpapers stay on your computer. The only outbound request the extension makes is fetching a site's icon from a public favicon service, and that request carries nothing but the domain name. No ads, no trackers, no analytics.

PERMISSIONS

• "Read and change your bookmarks" — used only when you click Import from Chrome bookmarks, to read the bookmarks you already have and add them to your new tab.
• "Read your browsing history" (current-tab access) — granted only when you click the extension icon, to prefill the current page's address and title in the Add form.
• Website access is limited to four favicon services, used solely to display site icons.

SUPPORT

Questions, bugs or suggestions: privacy@kskbl.com.cn

Version 1.0.3 — adds video wallpapers and the dock layout, keeps everything on your device.
```

ZH — full text in `public/_locales/zh_CN/description.txt`.

**Category** [REQUIRED]

Productivity

**Single Purpose** [REQUIRED]

Replaces the Chrome new tab page with the user's own grouped bookmark shortcuts and wallpapers.

<!-- 明确不包含搜索框 / 不修改默认搜索引擎 —— 上一版正因此被判 Red Argon。 -->

**Primary Language** [REQUIRED]

English (also localized: Chinese — Simplified)

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `public/icon/128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | 🟡 Needs update | — |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | 🟡 Needs update | — |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | 🟡 Needs update | — |
| Screenshot 4 | 1280×800 or 640×400 | ⬜ Not created | — |
| Screenshot 5 | 1280×800 or 640×400 | ⬜ Not created | — |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | — |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | — |

### Screenshot Notes

现有截图是旧版界面（顶部带搜索框），**必须重拍**，否则会被判「描述与实际功能不符」。

1. 分组卡片布局 + 壁纸（主界面全貌）
2. dock 布局（底部 dock）
3. 视频/图片壁纸设置面板
4. 导入导出 / 从 Chrome 书签导入
5. 深浅色主题对比

截图不得出现旧版搜索框或多引擎切换，因为这两个功能已删除。

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Saves the user's shortcuts, groups, layout and appearance settings locally so the new tab page looks the same after a restart. No data leaves the device. |
| `activeTab` | permissions | Grants access to the current tab only when the user clicks the extension icon or presses the Ctrl+Y shortcut, so the Add form can be pre-filled with that page's address and title. Nothing is read in the background. |
| `bookmarks` | permissions | Used only when the user clicks "Import from Chrome bookmarks", to read their existing bookmarks and add them as shortcuts on the new tab page. The extension never modifies or deletes bookmarks. |
| `https://www.google.com/*`, `https://*.google.com/*` | host_permissions | Requests an icon image for the domain of a site the user added (Google's public favicon endpoint). Used only to display the shortcut icon. |
| `https://icons.duckduckgo.com/*` | host_permissions | Fallback favicon source when Google returns no icon. Used only to display the shortcut icon. |
| `https://icon.horse/*` | host_permissions | Second fallback favicon source when the first two return nothing. Used only to display the shortcut icon. |

<!-- 审核重点关注：解释"为什么只在用户操作时使用"，并明确不读取页面内容。 -->

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

作者本人不收集、不上传、不存储任何用户数据。没有账号体系、没有云同步、没有自建服务器、没有统计或崩溃上报。

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | No | Domain names only, to public favicon services | Render the icon of a site the user added | Favicon providers receive the domain; the author never receives it |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

https://static.kskbl.com.cn/privacy/

<!-- 已上线并验证 200。源文件 docs/privacy-policy.html，服务器路径 /www/wwwroot/static/privacy/index.html。
     必须填在开发者后台「隐私权」标签页的字段里，不能只写进商品描述（上一版被拒原因 Purple Nickel）。 -->

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]

xy

**Contact Email** [REQUIRED]

privacy@kskbl.com.cn

**Support URL / Email** [RECOMMENDED]

privacy@kskbl.com.cn

**Homepage URL** [RECOMMENDED]

https://kskbl.com.cn

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.3 | 2026-11-17 | 移除网页搜索框与多引擎切换（Red Argon 整改）；移除标签页会话管理；移除 Google 登录与云同步，改为纯本地；权限收紧为 storage / activeTab / bookmarks；short description 由 169 字压缩到 129 字 | Draft |
| 1.0.2 | 2026-08-18 | 首次提交后被拒 | Rejected |

## Review Notes

### Known Issues / Limitations

- 截图仍是旧界面（含已删除的搜索框），提交前必须重拍。
- `e2e/` 下的 Playwright 用例仍覆盖已删除的搜索 / 会话功能，未同步更新。
- manifest 含 `key` 字段（历史遗留）；如上传报错再移除后重打包。
- 不提供网页搜索，不修改默认搜索引擎 —— 这是刻意的产品边界，不要在描述或截图中暗示相反。

### Rejection History

| Date | Reason | Fix Applied | Resubmitted |
|------|--------|-------------|-------------|
| 2026-08-18 | Red Argon — 更改新标签页与用户搜索体验：自带搜索框、可切换搜索引擎（默认 bing），未使用 Chrome Search API | 删除搜索框、引擎切换与搜索建议，扩展不再提供任何搜索入口；popup 内搜索框降级为纯本地快捷方式筛选 | 1.0.3 待提交 |
| 2026-08-18 | Purple Nickel — 未在指定字段提供隐私政策链接 | 编写中英双语隐私政策并托管到 https://static.kskbl.com.cn/privacy/，填写到后台「隐私权」标签页 | 1.0.3 待提交 |
