import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'myHistory',
    description: '开源、纯本地、可审计的浏览历史管理扩展',
    version: '0.1.0',
    action: {
      default_title: 'myHistory',
    },
    permissions: ['webNavigation', 'tabs', 'history', 'storage'],
    host_permissions: ['<all_urls>'],
  },
});
