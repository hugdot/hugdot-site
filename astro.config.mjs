import { defineConfig, envField } from 'astro/config'
import { fileURLToPath } from 'url'
import compress from 'astro-compress'
import icon from 'astro-icon'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { enhanceConfigForWorkspace } from './scripts/workspace-config.js'
import cloudflare from '@astrojs/cloudflare';

const viteConfig = {
  css: {
    preprocessorOptions: {
      scss: {
        logger: { warn: () => {} },
      },
    },
  },
  server: {
    proxy: {
      '/api/enka': {
        target: 'https://enka.network',
        changeOrigin: true,
        rewrite: (path) => {
          const uid = new URL('http://x' + path).searchParams.get('uid')
          return `/api/hsr/uid/${uid}`
        },
        headers: { 'User-Agent': 'HugDot/1.0 (hugdot.com)' },
      },
      '/api/mihomo': {
        target: 'https://api.mihomo.me',
        changeOrigin: true,
        rewrite: (path) => {
          const u    = new URL('http://x' + path)
          const uid  = u.searchParams.get('uid')
          const lang = u.searchParams.get('lang') || 'kr'
          return `/sr_info_parsed/${uid}?lang=${lang}`
        },
        headers: { 'User-Agent': 'HugDot/1.0 (hugdot.com)' },
      },
      '/api/mihomo-img': {
        target: 'https://api.mihomo.me',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/mihomo-img', ''),
      },
    },
  },
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@components':     fileURLToPath(new URL('./src/components',  import.meta.url)),
      '@layouts':        fileURLToPath(new URL('./src/layouts',     import.meta.url)),
      '@assets':         fileURLToPath(new URL('./src/assets',      import.meta.url)),
      '@content':        fileURLToPath(new URL('./src/content',     import.meta.url)),
      '@pages':          fileURLToPath(new URL('./src/pages',       import.meta.url)),
      '@public':         fileURLToPath(new URL('./public',          import.meta.url)),
      '@post-images':    fileURLToPath(new URL('./public/posts',    import.meta.url)),
      '@project-images': fileURLToPath(new URL('./public/projects', import.meta.url)),
      '@utils':          fileURLToPath(new URL('./src/utils',       import.meta.url)),
      '@theme-config':   fileURLToPath(new URL('./theme.config.ts', import.meta.url)),
      '@data':           fileURLToPath(new URL('./src/data',        import.meta.url)),
    },
  },
}

export default defineConfig({

  output: 'server', 
  
  adapter: cloudflare({
    mode: 'advanced' 
  }),  
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
