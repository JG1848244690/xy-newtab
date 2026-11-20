import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { localSceneRenderer } from './build/local-scene-renderer';
import { TODO_HOST_PERMISSION } from './src/services/todoSite';
import { WEATHER_HOST_PERMISSION } from './src/services/weatherSite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  vite: () => ({
    plugins: [tailwindcss()],
    optimizeDeps: { exclude: ['webwallgl'] },
  }),
  hooks: {
    'vite:build:extendConfig': (entrypoints, config) => {
      const sandboxOnly = entrypoints.every((entrypoint) => entrypoint.type === 'sandbox');
      (config.plugins ??= []).push(localSceneRenderer(sandboxOnly));
    },
    'vite:devServer:extendConfig': (config) => {
      (config.plugins ??= []).push(localSceneRenderer());
    },
  },

  manifest: ({ browser, manifestVersion, mode }) => ({
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

    // 书签和布局保存在本地；今日待办通过下面的可选权限连接。
    // activeTab：popup 打开时读取当前标签页 URL/标题用于「快捷添加」，仅在用户点击图标后授权
    // bookmarks：一键导入 Chrome 书签
    permissions: ['storage', 'activeTab', 'bookmarks',
      ...(manifestVersion === 3 && (browser === 'chrome' || browser === 'edge') ? ['alarms' as const] : [])],
    ...(manifestVersion === 3 && (browser === 'chrome' || browser === 'edge')
      ? { optional_permissions: ['downloads' as const] } : {}),
    ...(manifestVersion === 3 && (browser === 'chrome' || browser === 'edge') ? {
      content_security_policy: {
        extension_pages: "script-src 'self'; object-src 'self'; frame-src 'self';",
        sandbox: [
          "sandbox allow-scripts",
          "default-src 'none'",
          "script-src 'self' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "connect-src data: blob:",
          "img-src 'self' data: blob:",
          "media-src data: blob:",
          "font-src data: blob:",
          "form-action 'none'",
          "base-uri 'none'",
        ].join('; '),
      },
    } : {}),
    ...(manifestVersion === 3
      ? { optional_host_permissions: [TODO_HOST_PERMISSION, WEATHER_HOST_PERMISSION] }
      : { optional_permissions: [TODO_HOST_PERMISSION, WEATHER_HOST_PERMISSION] }),
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
