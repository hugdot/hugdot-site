// astro.config.mjs
import { defineConfig, envField } from 'astro/config'
import { fileURLToPath } from 'url'
import icon from 'astro-icon'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { enhanceConfigForWorkspace } from './scripts/workspace-config.js'
import cloudflare from '@astrojs/cloudflare'

const viteConfig = {
  server: {
    proxy: {
      // 1. UID 데이터 프록시
      '/api/mihomo': {
        target: 'https://api.mihomo.me/sr_info_parsed',
        changeOrigin: true,
        rewrite: (path) => {
          const params = new URLSearchParams(path.split('?')[1]);
          return `/${params.get('uid')}?lang=${params.get('lang') || 'kr'}`;
        },
      },
      // 2. 이미지 프록시 (이걸 추가해야 profile.astro의 이미지가 나옵니다)
      '/api/mihomo-img': {
        target: 'https://api.mihomo.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mihomo-img/, ''),
      }
    }
  },
  // ------------------------------
  css: {
    preprocessorOptions: {
      scss: { logger: { warn: () => {} } },
    },
  },
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@content': fileURLToPath(new URL('./src/content', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@public': fileURLToPath(new URL('./public', import.meta.url)),
      '@post-images': fileURLToPath(new URL('./public/posts', import.meta.url)),
      '@project-images': fileURLToPath(new URL('./public/projects', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@theme-config': fileURLToPath(new URL('./theme.config.ts', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
  },
}

export default defineConfig({
  output: 'static', // Astro 5 권장 (API Route 대신 Proxy/Redirect 사용)
  adapter: cloudflare({
    mode: 'directory',
    imageService: 'compile',
  }),
  compressHTML: false,
  site: 'https://hugdot.com',
  integrations: [icon(), mdx(), sitemap()],
  vite: enhanceConfigForWorkspace(viteConfig), // 수정된 viteConfig 적용
  env: {
    schema: {
      BLOG_API_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: 'https://jsonplaceholder.typicode.com/posts',
      }),
    },
  },
})