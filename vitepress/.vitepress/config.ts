import { defineConfig } from 'vitepress'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  title: 'AI x Math',
  themeConfig: {
    siteTitle: 'AI x Math',
    logo: '/logo.png',
    nav: [
    ],
  },
  vite: {
    plugins: [
      UnoCSS({
        inspector: false,
      }) as any,
    ],
  },
  appearance: false,
})
