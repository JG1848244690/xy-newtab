import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { localSceneRenderer } from './build/local-scene-renderer';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  vite: () => ({
    plugins: [tailwindcss(), localSceneRenderer()],
    optimizeDeps: { exclude: ['webwallgl'] },
  }),

  manifest: ({ browser, mode }) => ({
    // Web Store 多语言展示:default_locale 决定 fallback,其它语种用 _locales/<lang>/messages.json
    // 扩展内 UI 文案走 src/i18n(en / zh_CN),与这里各自独立。
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // ===== 固定 Chrome 扩展 ID =====
    // 填的是公钥(SPKI DER base64)。Chrome 算 ID 用 SHA256(public_key_der),
    // 填公钥跟填私钥算出的 ID 一致。配套商店 ID: lanccjojcmdklbhnbmbfemiabnpbgoga
    // 来源:Web Store 后台 "View public key" 复制的 PEM 格式公钥。
    // 本地 build + unpacked / zip 加载 → ID = lanccjojcmdklbhnbmbfemiabnpbgoga
    //
    // 商店模式由现有商品签名固定 ID，本地 Chrome 开发构建继续使用公钥。
    ...(browser === 'chrome' && mode !== 'store'
      ? {
          key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtwviahYyO4WgRBeskNPGEbc3d+n3azzZbiz4gdl7QGtWsyXe5EI5RZc93t8sTrGpFsO50W5DGqm/NP2/SeFz3K43KLAVzqlllAtLCYm4YLCn+M1a3U+sxYMUERGiRwmfxvs+/3njQkkTdhbUDz39HOxxtCaoYpmPnA+9nqZVcNUMvJU9OgHu0hUmo4n/tRCyDkIyPrjYFPboJ6njXMsL/7q3poB1Is9u1LiT+uxGxuukB0RZs8sB+gxM3X3XjkyaX1Z3+J1+tVb0d8IxiYJjEFCKkYAZDjiOOZb3O6QGEOFHNb+ZysFDYJzMaZ9tW9pt9ruUP3igwPTkkzCdAzwxfQIDAQAB',
        }
      : {}),

    // 扩展纯本地运行：无账号、无云同步、无自建后端
    // activeTab：popup 打开时读取当前标签页 URL/标题用于「快捷添加」，仅在用户点击图标后授权
    // bookmarks：一键导入 Chrome 书签
    permissions: ['storage', 'activeTab', 'bookmarks'],
    host_permissions: [
      // 仅向图标服务发送快捷方式所在域名以获取 favicon。
      'https://www.google.com/*',
      'https://*.google.com/*',
      'https://icons.duckduckgo.com/*',
      'https://icon.horse/*',
    ],
    action: {
      default_title: '__MSG_extName__',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Y',
          mac: 'Command+Y',
        },
        description: '打开快捷面板',
      },
    },
  }),
});
