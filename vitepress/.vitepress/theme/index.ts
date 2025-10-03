import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from '../../src/Layout.vue'
import 'virtual:uno.css'
import '../../src/style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
  },
} satisfies Theme
