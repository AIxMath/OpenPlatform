import UnoCSS from 'unocss/vite'
import Inspect from 'vite-plugin-inspect'
import { defineConfig } from 'vitepress'
import { markdownOptions } from './markdownOptions'

export default defineConfig({
  title: 'AI x Math',
  cleanUrls: true, // 启用干净的 URL，不自动添加 .html 后缀
  head: [
    ['link', { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    siteTitle: 'AI x Math',
    logo: '/icon.svg',
    nav: [
    ],
  },
  rewrites(id) {
    const legacyBlogMatch = id.match(/^content\/([^/]+)\/blog\/([^/]+\.md)$/)
    if (legacyBlogMatch) {
      return `blog/${legacyBlogMatch[2]}`
    }

    if (id.startsWith('content/')) {
      return id.slice('content/'.length)
    }
    return id
  },
  vite: {
    plugins: [
      UnoCSS({
        inspector: false,
      }) as any,
      Inspect({
      }),
    ],
  },
  appearance: false,
  markdown: markdownOptions,
})
