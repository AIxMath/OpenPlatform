---
layout: page
navbar: false
sidebar: false
aside: false
footer: false
pageClass: dash-page
---

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
const AsyncComp = defineAsyncComponent(async () => {
  const { default: Comp } = await import(`./pages/${__pageData.params.page}.vue`)
  return Comp
})
</script>

<ClientOnly>
  <AsyncComp />
</ClientOnly>
