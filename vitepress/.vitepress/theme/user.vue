<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { login, token, userName } from '../../src/states'
import { trpc } from '../../src/trpc'

// 定义用户信息类型
interface UserInfo {
  _id: string
  username: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

const userInfo = ref<UserInfo | null>(null)
const isLoading = ref(false)
const error = ref('')

const loginForm = reactive({
  usernameOrEmail: '',
  password: '',
})

const isLoggedIn = computed(() => !!token.value && !!userName.value)

// 获取用户信息
async function fetchUserInfo() {
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

// 处理登录
async function handleLogin() {
  if (isLoading.value)
    return

  isLoading.value = true
  error.value = ''

  try {
    await login(loginForm.usernameOrEmail, loginForm.password)
    // 登录成功后获取用户信息
    await fetchUserInfo()
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
function logout() {
  userName.value = null
  token.value = null
  userInfo.value = null
  error.value = ''
}

// 组件挂载时检查登录状态
onMounted(async () => {
  if (isLoggedIn.value) {
    await fetchUserInfo()
  }
})
</script>

<template>
  <div class="user-component">
    <!-- 已登录状态 - 显示用户信息 -->
    <div v-if="isLoggedIn" class="user-info">
      <div class="user-header">
        <div class="user-avatar">
          {{ userInfo?.username?.[0]?.toUpperCase() || 'U' }}
        </div>
        <div class="user-details">
          <h3 class="username">
            {{ userInfo?.username }}
          </h3>
          <p class="email">
            {{ userInfo?.email }}
          </p>
          <span class="role" :class="userInfo?.role">{{ userInfo?.role }}</span>
        </div>
      </div>

      <div class="user-actions">
        <button class="logout-btn" @click="logout">
          退出登录
        </button>
      </div>
    </div>

    <!-- 未登录状态 - 显示登录界面 -->
    <div v-else class="login-form">
      <h2>用户登录</h2>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="usernameOrEmail">用户名或邮箱</label>
          <input
            id="usernameOrEmail"
            v-model="loginForm.usernameOrEmail"
            type="text"
            required
            placeholder="请输入用户名或邮箱"
            :disabled="isLoading"
          >
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            required
            placeholder="请输入密码"
            :disabled="isLoading"
          >
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
          type="submit"
          class="login-btn"
          :disabled="isLoading || !loginForm.usernameOrEmail || !loginForm.password"
        >
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.user-component {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

/* 用户信息样式 */
.user-info {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-border);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--vp-c-brand);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.user-details {
  flex: 1;
}

.username {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: var(--vp-c-text-1);
}

.email {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.role {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role.admin {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger);
}

.role.user {
  background: var(--vp-c-tip-soft);
  color: var(--vp-c-tip);
}

.user-actions {
  text-align: center;
}

.logout-btn {
  background: var(--vp-c-danger);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: var(--vp-c-danger-dark);
}

/* 登录表单样式 */
.login-form {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 2rem;
  border: 1px solid var(--vp-c-border);
}

.login-form h2 {
  text-align: center;
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--vp-c-danger);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.5rem;
  background: var(--vp-c-danger-soft);
  border-radius: 4px;
}

.login-btn {
  width: 100%;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-dark);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
