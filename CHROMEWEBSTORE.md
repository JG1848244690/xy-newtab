# Chrome Web Store 提审资料

## 商品

| 字段 | 值 |
| --- | --- |
| 商品 ID | `lanccjojcmdklbhnbmbfemiabnpbgoga` |
| 主语言 | English |
| 本地化商品页 | 简体中文 |
| 类别 | Productivity |
| 单一用途 | Replace Chrome’s new tab with a customizable start page for bookmarks, wallpapers and an optional view of Xuyan tasks. |
| 反馈 | privacy@kskbl.com.cn |
| 1.0.4 | 新增本地 Wallpaper Engine Scene，默认毛玻璃 Dock，右上角快速切换布局，优化设置面板及语言跟随 |
| 1.0.5 | 本地 SceneScript 鼠标互动、可选序言待办、Windows Dock 任务栏避让 |

2026-11-19 提交了 1.0.4。以下更新针对下一次提审的开发版本，包含本地 Scene 鼠标互动和可选待办面板。

[英文详情](public/_locales/en/description.txt) · [中文详情](public/_locales/zh_CN/description.txt) · [英文名称及简介](public/_locales/en/messages.json) · [中文名称及简介](public/_locales/zh_CN/messages.json)

文案将 Wallpaper Engine 支持限定为本地导入的兼容 Scene。部分场景可响应鼠标，支持情况因壁纸而异。书签、布局及导入壁纸留在本机，待办和图标的网络请求单独披露。

## 文件和截图

运行 `pnpm zip:store`，输出文件名包含 `package.json` 的版本号。下一次提审使用高于已提交版本的版本号。商店模式不写入开发用公钥，通过现有商品上传即可沿用扩展 ID。

在自己的 Chrome 配置里预览新版时，运行 `pnpm build`，在扩展管理页加载或重新载入 `.output/chrome-mv3`，确认 ID 为 `lanccjojcmdklbhnbmbfemiabnpbgoga`。解压商店 ZIP 后直接加载，Chrome 会分配另一个 ID 并打开独立的书签存储。切回原 ID 即可重新访问原来的本地数据。

如果准备长期加载本地版本，先把成功构建的 `.output/chrome-mv3` 复制到 `.local-install/chrome-mv3`，再从扩展管理页加载该目录。WXT 重新构建时会清理原输出目录，Chrome 保存的加载路径需要始终可用。

图标使用包内 `icon/128.png`。英语和简体中文商品页共用全球通用的英文截图，尺寸为 1280 × 800。布局图使用真实书签和操作界面，文件位于 `.output/store-refresh/screenshots/en/`。

| 顺序 | 画面 | 素材状态 |
| --- | --- | --- |
| 1 | Dock 桌面，含时钟、书签、分页和完整的底部 Dock | 共用 |
| 2 | 分组布局，显示两个展开的书签分组 | 共用 |
| 3 | 「设置 → Scene 壁纸」，看得到导入入口 | 共用，使用已有的原创背景示例 |

优先拍 16:10 的浏览器内容区，隐藏任务栏、地址栏和个人账号信息。书签名称可以保留原语言。

## 隐私权

[现有公开隐私政策](https://github.com/JG1848244690/xy-newtab/blob/codex/privacy-policy/docs/privacy-policy.md) · [下一版政策文案](docs/privacy-policy.md) · [本地 HTML 源文件](docs/privacy-policy.html)

提审前同步公开政策、商店说明和后台隐私披露。新版包含经用户授权的待办读写，不能沿用旧版的「完全无账号或站点会话使用」表述。

| 权限 | 后台理由 |
| --- | --- |
| `storage` | Stores shortcuts, groups, Dock pins and preferences locally so the user's new tab is restored when Chrome restarts. |
| `activeTab` | When the user invokes the extension, reads the active tab's URL and title to prefill the Add shortcut form. |
| `bookmarks` | Reads the local Chrome bookmark tree only when the user chooses Import from Chrome bookmarks, then creates local new tab shortcuts. |
| `alarms` | Schedules local JSON backups after bookmark or layout changes and checks periodically, only when automatic backup is enabled. |
| `downloads`（可选） | Writes user-enabled automatic bookmark and layout backups to the browser's download folder. Backup files stay on the device and can be restored after uninstalling and reinstalling. |
| 图标主机权限 | Contacts icon.horse, DuckDuckGo and Google to fetch shortcut favicons. Sends the hostname without the page path, query string or title and caches the image locally. |
| `https://hls.kskbl.com.cn/*`（可选） | Requested when the user connects the Tasks panel. It reads and updates tasks on the Xuyan website using the browser’s existing session. Bookmark and wallpaper features work without this permission. |
| `https://api.weatherapi.com/*`（天气开发版本，可选） | Requested when the user enables weather. Sends the manually entered city and user-provided API key to WeatherAPI.com to fetch weather for the Dock clock. No device location permission is requested. |
| 远程代码 | No remotely hosted scripts. The bundled renderer can run SceneScript from a file the user selects inside a sandboxed page without extension API access. |

隐私披露需覆盖书签域名和网页资料，以及可选待办的标题、备注、日期、时段、完成状态和网站会话的使用。书签资料和壁纸在本机处理。图标查询向对应服务发送域名。预设背景来自 Unsplash，在线图片由对应图片主机提供。待办请求由浏览器携带已有的站点会话，待办数据由序言网站保存。扩展没有广告、分析、遥测和书签云同步。按实际数据处理情况填写后台类别并确认有限使用声明。

## 审核测试说明

> Open a new tab and use the layout button in the top-right toolbar to switch between Dock and grouped bookmarks. Bookmark search filters the local list. To test a Scene, open Settings → Scene wallpaper and choose a compatible local Wallpaper Engine folder or scene.pkg with its optional project.json. The renderer is bundled and loads local files. Supported SceneScripts run in an isolated sandbox. System audio effects and Web/HTML wallpapers are unsupported. Bookmark and wallpaper features work without signing in. To use Tasks, open the clipboard button, grant optional site access, and sign in on the Xuyan website.

历史问题包括网页搜索引擎切换（Red Argon）及隐私政策链接缺失（Purple Nickel）。1.0.5 的商品详情和权限理由按当前功能填写。
