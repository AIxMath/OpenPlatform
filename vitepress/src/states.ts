import { useLocalStorage } from '@vueuse/core'
import { computed, reactive, shallowRef } from 'vue'
import { trpc } from './trpc'

// 用户信息类型
interface UserInfo {
  _id: string
  username: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

// 全局状态
export const userName = shallowRef<string | null>(null)
export const token = useLocalStorage<string | null>('auth_token', null)
export const userInfo = shallowRef<UserInfo | null>(null)
export const isLoading = shallowRef(false)
export const error = shallowRef('')

// 登录表单状态
export const loginForm = reactive({
  usernameOrEmail: '',
  password: '',
})

// 计算属性
export const isLoggedIn = computed(() => !!token.value && !!userName.value)

// 获取用户信息
export async function fetchUserInfo() {
  if (!token.value)
    return

  try {
    userInfo.value = await trpc.getMe.query()
  }
  catch (err) {
    console.error('Failed to fetch user info:', err)
    // 如果获取用户信息失败，可能是token过期，清除本地状态
    logout()
  }
}

// 登录
export async function login(usernameOrEmail: string, password: string) {
  const res = await trpc.login.mutate({
    usernameOrEmail,
    password,
  })
  userName.value = res.user.username
  token.value = res.token
  await fetchUserInfo()
}

// 处理登录表单提交
export async function handleLogin() {
  if (isLoading.value)
    return

  isLoading.value = true
  error.value = ''

  try {
    await login(loginForm.usernameOrEmail, loginForm.password)
    // 清空表单
    loginForm.usernameOrEmail = ''
    loginForm.password = ''
  }
  catch (err: any) {
    error.value = err.message || '登录失败，请检查用户名和密码'
  }
  finally {
    isLoading.value = false
  }
}

// 退出登录
export function logout() {
  userName.value = null
  token.value = null
  userInfo.value = null
  error.value = ''
  loginForm.usernameOrEmail = ''
  loginForm.password = ''
}

// 初始化用户状态
export async function initUserState() {
  if (isLoggedIn.value) {
    await fetchUserInfo()
  }
}
