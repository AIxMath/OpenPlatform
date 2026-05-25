---
layout: page
sidebar: false
aside: false
footer: false
pageClass: dash-page
---

<script setup lang="ts">
import LoginPage from './dash/pages/login.vue'
</script>

<ClientOnly>
  <LoginPage />
</ClientOnly>
