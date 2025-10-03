import type { Theme } from 'vitepress'
import { createPinia } from 'pinia'
import DefaultTheme from 'vitepress/theme'
import Layout from '../../dash/Layout.vue'
import 'virtual:uno.css'
import '../../dash/style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    app.use(createPinia())
  },
} satisfies Theme
