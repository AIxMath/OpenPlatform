import UnoCSS from 'unocss/vite'
import Inspect from 'vite-plugin-inspect'
import { defineConfig } from 'vitepress'
import { markdownOptions } from './markdownOptions'

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
      Inspect({
      }),
    ],
  },
  appearance: false,
  markdown: markdownOptions,
})
