<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <!-- 标题区域 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-light text-gray-800 mb-2">登录</h1>
        <p class="text-sm text-gray-500">欢迎回来，请登录您的账户</p>
      </div>

      <!-- 登录表单 -->
      <div class="bg-white border border-gray-200 rounded-lg p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 用户名/邮箱输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              用户名或邮箱
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:person-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="form.usernameOrEmail"
                type="text"
                placeholder="请输入用户名或邮箱"
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                :disabled="isLoading"
              />
            </div>
            <p v-if="errors.usernameOrEmail" class="mt-1 text-sm text-red-500">
              {{ errors.usernameOrEmail }}
            </p>
          </div>

          <!-- 密码输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:lock-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                :disabled="isLoading"
              >
                <div 
                  :class="showPassword ? 'i-material-symbols:visibility-off-outline' : 'i-material-symbols:visibility-outline'" 
                  class="w-5 h-5"
                />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-500">
              {{ errors.password }}
            </p>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2.5 border-2 border-gray-800 text-gray-800 rounded-md font-medium hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="isLoading" class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isLoading ? '登录中...' : '登录' }}</span>
          </button>
        </form>

        <!-- 分割线 -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-gray-500">或</span>
          </div>
        </div>

        <!-- 注册链接 -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            还没有账户？
            <router-link 
              to="/register" 
              class="text-gray-800 font-medium hover:underline inline-flex items-center gap-1"
            >
              立即注册
              <div class="i-material-symbols:arrow-forward w-4 h-4" />
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  usernameOrEmail: '',
  password: '',
})

const errors = reactive({
  usernameOrEmail: '',
  password: '',
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const validateForm = () => {
  errors.usernameOrEmail = ''
  errors.password = ''
  errorMessage.value = ''

  let isValid = true

  if (!form.usernameOrEmail.trim()) {
    errors.usernameOrEmail = '请输入用户名或邮箱'
    isValid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // TODO: 实现登录逻辑
    console.log('登录', form)
    
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 登录成功后跳转
    // router.push('/')
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败，请检查用户名和密码'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 输入框自动填充样式覆盖 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px white inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>

