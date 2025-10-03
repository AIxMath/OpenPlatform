<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import LoginButton from './components/LoginButton.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <ClientOnly>
        <LoginButton />
      </ClientOnly>
    </template>
  </Layout>
</template>

<style scoped>
</style>
