<script setup lang="ts">
import { onMounted } from 'vue'
import {
  error,
  handleLogin,
  initUserState,
  isLoading,
  isLoggedIn,
  loginForm,
  logout,
  userInfo,
} from './states'

onMounted(() => {
  initUserState()
})
</script>

<template>
  <div class="flex justify-center px-2">
    <div class="w-full max-w-82">
      <div v-if="isLoggedIn" class="flex items-center gap-3 py-2">
        <div class="w-8 h-8 rounded-full bg-[var(--vp-c-brand)] text-white flex items-center justify-center text-sm font-600 select-none">
          {{ userInfo?.username?.[0]?.toUpperCase() || 'U' }}
        </div>
        <div class="flex-1 min-w-0 leading-snug">
          <div class="font-600 text-[var(--vp-c-text-1)] text-sm">
            {{ userInfo?.username }}
          </div>
          <div class="text-xs text-[var(--vp-c-text-2)] truncate">
            {{ userInfo?.email }}
          </div>
          <div class="text-[10px] uppercase tracking-wide text-[var(--vp-c-text-3)] mt-0.5">
            {{ userInfo?.role }}
          </div>
        </div>
        <button
          class="px-2 py-1 text-xs border border-solid border-[#ccc] rounded hover:border-[var(--vp-c-text-2)] hover:text-[var(--vp-c-text-1)] text-[var(--vp-c-text-2)] transition-colors bg-transparent cursor-pointer"
          @click="logout"
        >
          退出
        </button>
      </div>

      <div v-else class="py-2">
        <div class="text-3xl mb-3 text-[var(--vp-c-text-1)] font-600 text-center">
          登录
        </div>
        <form class="flex flex-col gap-2" @submit.prevent="handleLogin">
          <input
            v-model="loginForm.usernameOrEmail"
            type="text"
            placeholder="用户名或邮箱"
            :disabled="isLoading"
            required
            class="px-3 py-2 text-sm border border-solid border-[#ccc] rounded bg-transparent outline-none transition-colors placeholder:text-[var(--vp-c-text-3)] disabled:opacity-50"
          >
          <input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            :disabled="isLoading"
            required
            class="px-3 py-2 text-sm border border-solid border-[#ccc] rounded bg-transparent outline-none transition-colors placeholder:text-[var(--vp-c-text-3)] disabled:opacity-50"
          >
          <div v-if="error" class="text-[var(--vp-c-danger)] text-xs mt-1 leading-tight">
            {{ error }}
          </div>
          <button
            type="submit"
            :disabled="isLoading"
            class="mt-1 px-3 py-2 text-sm font-500 rounded border border-[var(--vp-c-brand)] text-[var(--vp-c-brand)] bg-transparent hover:bg-[var(--vp-c-brand-soft)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 补充很小的差异化（可选） */
</style>
