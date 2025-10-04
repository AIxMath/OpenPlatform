<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="login-button-container">
    <!-- 已登录状态 -->
    <a
      v-if="authStore.user"
      href="/dash/user"
      class="user-button"
    >
      <div class="i-material-symbols:person-outline w-5 h-5" />
      <span>{{ authStore.user.username }}</span>
    </a>

    <!-- 未登录状态 -->
    <div v-else class="auth-buttons">
      <a href="/dash/login" class="login-btn">
        登录
      </a>
      <a href="/dash/register" class="register-btn">
        注册
      </a>
    </div>
  </div>
</template>

<style scoped>
.login-button-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  border-radius: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
  border: 1px solid #d1d5db;
}

.user-button:hover {
  color: #1f2937;
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-btn,
.register-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
}

.login-btn {
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.login-btn:hover {
  color: #1f2937;
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.register-btn {
  color: white;
  background-color: #1f2937;
  border: 1px solid #1f2937;
}

.register-btn:hover {
  background-color: #111827;
  border-color: #111827;
}
</style>
