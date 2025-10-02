import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface User {
  _id: string
  username: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 设置认证信息
  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('auth_token', newToken)
  }

  // 清除认证信息（登出）
  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
  }

  // 登出
  function logout() {
    clearAuth()
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    setAuth,
    clearAuth,
    logout,
  }
})

