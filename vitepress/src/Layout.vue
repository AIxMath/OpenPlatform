<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout >
    <template #nav-bar-content-after>
      <a href="/user" p-2 ml-2 text-sm font-medium border="1px solid #ccc" rounded hover:bg-gray-100>
        Login
      </a>
    </template>
  </Layout>
</template>

<style scoped>
</style>
