# Chrome Web Store 提审资料

## 商品

| 字段 | 值 |
| --- | --- |
| 商品 ID | `lanccjojcmdklbhnbmbfemiabnpbgoga` |
| 主语言 | English |
| 本地化商品页 | 简体中文 |
| 类别 | Productivity |
| 单一用途 | Customize the Chrome new tab page with organized bookmark shortcuts and a user-selected background. |
| 反馈 | privacy@kskbl.com.cn |
| 1.0.4 | 新增本地 Wallpaper Engine Scene，默认毛玻璃 Dock，右上角快速切换布局，优化设置面板及语言跟随 |

2026-11-19 已提交 1.0.4 审核，选择通过后自动发布。审核期间公开版本为 1.0.3。

[英文详情](public/_locales/en/description.txt) · [中文详情](public/_locales/zh_CN/description.txt) · [英文名称及简介](public/_locales/en/messages.json) · [中文名称及简介](public/_locales/zh_CN/messages.json)

英文简介 125 字符。文案明确限定为用户选取的本地 Scene 文件、无 SceneScript 或音频，避免暗示可在线浏览创意工坊、支持 Web 壁纸或与 Wallpaper Engine 官方合作。

## 文件和截图

运行 `pnpm zip:store` 生成 `.output/my-test-extension-1.0.4-chrome.zip`。商店模式不写入开发用公钥，通过现有商品上传即可沿用扩展 ID。

图标使用包内 `icon/128.png`。新版 1280 × 800 截图位于 `.output/store-1.0.4/`，包含浮动 Dock、分组书签和 Scene 导入设置。截图使用演示书签和原创背景。分组页面的搜索框仅筛选本地快捷方式。

## 隐私权

[公开隐私政策](https://github.com/JG1848244690/xy-newtab/blob/codex/privacy-policy/docs/privacy-policy.md) · [本地 HTML 源文件](docs/privacy-policy.html)

| 权限 | 后台理由 |
| --- | --- |
| `storage` | Stores shortcuts, groups, Dock pins and preferences locally so the user's new tab is restored when Chrome restarts. |
| `activeTab` | When the user invokes the extension, reads the active tab's URL and title to prefill the Add shortcut form. |
| `bookmarks` | Reads the local Chrome bookmark tree only when the user chooses Import from Chrome bookmarks, then creates local new tab shortcuts. |
| 主机权限 | Contacts icon.horse, DuckDuckGo and Google only to fetch the visible shortcut's favicon. Sends its hostname without the page path, query string or title and caches the image locally. |
| 远程代码 | No. The package bundles the renderer and accepts local Scene data. The extension does not load executable JavaScript from servers or Scene packages. |

数据披露填写「网络记录」和「网站内容」，对应扩展处理用户明确选取的网页 URL、标题、超链接及壁纸媒体。扩展不会读取 Chrome 历史记录数据库。favicon 服务只收到域名，预设背景来自 Unsplash，用户输入的在线图片地址由对应主机提供。三项有限使用声明均需确认。

## 审核测试说明

> No sign-in is needed. Open a new tab and use the middle button in the top-right toolbar to switch from Dock to grouped bookmarks. Search shortcuts filters the local list. To test animation, open Settings → Scene wallpaper and choose a local Wallpaper Engine Scene folder or scene.pkg with its optional project.json. The renderer is bundled and reads files locally. SceneScript, audio and Web/HTML wallpapers are unsupported.

历史问题包括网页搜索引擎切换（Red Argon）及隐私政策链接缺失（Purple Nickel）。1.0.4 的商品详情和权限理由按当前功能填写。
