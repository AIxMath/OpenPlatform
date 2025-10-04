<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import NavBar from './components/NavBar.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <ClientOnly>
        <NavBar />
      </ClientOnly>
    </template>
  </Layout>
</template>

<style scoped>
</style>
