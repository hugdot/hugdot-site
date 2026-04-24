// astro.config.mjs
import { defineConfig, envField } from 'astro/config'
import { fileURLToPath } from 'url'
import icon from 'astro-icon'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { enhanceConfigForWorkspace } from './scripts/workspace-config.js'

const viteConfig = {
  server: {
    proxy: {
      // 1. UID 데이터 프록시 (로컬 개발 환경용)
      '/api/mihomo': {
        target: 'https://api.mihomo.me/sr_info_parsed',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const uid = url.searchParams.get('uid');
          const lang = url.searchParams.get('lang') || 'kr';
          return `/${uid}?lang=${lang}`;
        },
      },
      // 2. 이미지 프록시 (로컬 개발 환경용 - GitHub 주소로 연결)
      '/api/mihomo-img': {
        target: 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const imgPath = url.searchParams.get('img');
          return `/${imgPath}`;
        },
      }
    }
  },
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
  output: 'static', // 정적 사이트 모드 유지
  compressHTML: false,
  site: 'https://hugdot.com',
  integrations: [icon(), mdx(), sitemap()],
  vite: enhanceConfigForWorkspace(viteConfig), 
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