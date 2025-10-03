<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useAuthStore } from './stores/auth';

const { Layout } = DefaultTheme

const authStore = useAuthStore()
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <ClientOnly>
        <a v-if="authStore.user" href="/dash/user" p-2 ml-2 text-sm font-medium border="1px solid #ccc" rounded hover:bg-gray-100>
          {{ authStore.user.username }}
        </a>
        <a v-else href="/dash/login" p-2 ml-2 text-sm font-medium border="1px solid #ccc" rounded hover:bg-gray-100>
          Login
        </a>
      </ClientOnly>
    </template>
  </Layout>
</template>

<style scoped>
</style>
