import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface User {
  _id: string
  username: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  // 从 localStorage 读取初始状态
  const storedUser = localStorage.getItem('auth_user')

  // 状态
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(storedUser ? JSON.parse(storedUser) : null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 设置认证信息
  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))

    // 同时设置 Cookie，使浏览器访问博客时能够携带认证信息
    // 设置过期时间为7天
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    document.cookie = `token=${newToken}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
  }

  // 清除认证信息（登出）
  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')

    // 清除 Cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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
