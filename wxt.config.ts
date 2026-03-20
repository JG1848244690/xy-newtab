import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // WXT 模块
  modules: ['@wxt-dev/module-react'],

  // Vite 插件配置
  vite: () => ({
    plugins: [tailwindcss() as unknown as Plugin],
  }),

  // Manifest 配置
  manifest: {
    name: 'My Test Extension',
    permissions: ['storage'],
    // host_permissions: ['*://*.example.com/*'],  // 根据目标网站配置
  },
});
