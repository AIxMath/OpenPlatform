<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <a v-if="authStore.user" href="/dash/user" p-2 ml-2 text-sm font-medium border="1px solid #ccc" rounded hover:bg-gray-100>
    {{ authStore.user.username }}
  </a>
  <a v-else href="/dash/login" p-2 ml-2 text-sm font-medium border="1px solid #ccc" rounded hover:bg-gray-100>
    Login
  </a>
</template>

<style scoped>
</style>
