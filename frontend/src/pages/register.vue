<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
    <div class="w-full max-w-md">
      <!-- 标题区域 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-light text-gray-800 mb-2">注册</h1>
        <p class="text-sm text-gray-500">创建您的账户，开始使用</p>
      </div>

      <!-- 注册表单 -->
      <div class="bg-white border border-gray-200 rounded-lg p-8">
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- 用户名输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:person-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="form.username"
                type="text"
                placeholder="3-20个字符，仅限字母数字下划线"
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                :disabled="isLoading"
                @blur="validateUsername"
              />
            </div>
            <p v-if="errors.username" class="mt-1 text-sm text-red-500">
              {{ errors.username }}
            </p>
          </div>

          <!-- 邮箱输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:mail-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱地址"
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                :disabled="isLoading"
                @blur="validateEmail"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-sm text-red-500">
              {{ errors.email }}
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
                placeholder="至少8个字符，包含大小写字母和数字"
                class="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                :disabled="isLoading"
                @input="updatePasswordStrength"
                @blur="validatePassword"
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
            
            <!-- 密码强度指示器 -->
            <div v-if="form.password" class="mt-2">
              <div class="flex gap-1 mb-1">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-colors"
                  :class="i <= passwordStrength ? getStrengthColor() : 'bg-gray-200'"
                />
              </div>
              <p class="text-xs text-gray-500">
                密码强度：{{ getStrengthText() }}
              </p>
            </div>
          </div>

          <!-- 确认密码输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:lock-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="请再次输入密码"
                class="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                :disabled="isLoading"
                @blur="validateConfirmPassword"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                :disabled="isLoading"
              >
                <div 
                  :class="showConfirmPassword ? 'i-material-symbols:visibility-off-outline' : 'i-material-symbols:visibility-outline'" 
                  class="w-5 h-5"
                />
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-500">
              {{ errors.confirmPassword }}
            </p>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>

          <!-- 注册按钮 -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2.5 border-2 border-gray-800 text-gray-800 rounded-md font-medium hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="isLoading" class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isLoading ? '注册中...' : '注册' }}</span>
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

        <!-- 登录链接 -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            已有账户？
            <router-link 
              to="/login" 
              class="text-gray-800 font-medium hover:underline inline-flex items-center gap-1"
            >
              立即登录
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
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const passwordStrength = ref(0)

// 验证用户名
const validateUsername = () => {
  errors.username = ''
  
  if (!form.username) {
    errors.username = '请输入用户名'
    return false
  }
  
  if (form.username.length < 3) {
    errors.username = '用户名至少需要3个字符'
    return false
  }
  
  if (form.username.length > 20) {
    errors.username = '用户名最多20个字符'
    return false
  }
  
  if (!/^\w+$/.test(form.username)) {
    errors.username = '用户名只能包含字母、数字和下划线'
    return false
  }
  
  return true
}

// 验证邮箱
const validateEmail = () => {
  errors.email = ''
  
  if (!form.email) {
    errors.email = '请输入邮箱'
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    return false
  }
  
  return true
}

// 验证密码
const validatePassword = () => {
  errors.password = ''
  
  if (!form.password) {
    errors.password = '请输入密码'
    return false
  }
  
  if (form.password.length < 8) {
    errors.password = '密码至少需要8个字符'
    return false
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = '密码必须包含至少一个大写字母、一个小写字母和一个数字'
    return false
  }
  
  return true
}

// 验证确认密码
const validateConfirmPassword = () => {
  errors.confirmPassword = ''
  
  if (!form.confirmPassword) {
    errors.confirmPassword = '请再次输入密码'
    return false
  }
  
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    return false
  }
  
  return true
}

// 更新密码强度
const updatePasswordStrength = () => {
  const password = form.password
  let strength = 0
  
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) strength++
  if (/(?=.*\d)/.test(password)) strength++
  if (/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) strength++
  
  passwordStrength.value = Math.min(strength, 4)
}

// 获取密码强度颜色
const getStrengthColor = () => {
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400']
  return colors[passwordStrength.value - 1] || 'bg-gray-200'
}

// 获取密码强度文本
const getStrengthText = () => {
  const texts = ['弱', '中等', '良好', '强']
  return texts[passwordStrength.value - 1] || '太弱'
}

// 表单验证
const validateForm = () => {
  errorMessage.value = ''
  
  const isUsernameValid = validateUsername()
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()
  const isConfirmPasswordValid = validateConfirmPassword()
  
  return isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid
}

// 处理注册
const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // TODO: 实现注册逻辑
    console.log('注册', {
      username: form.username,
      email: form.email,
      password: form.password,
    })
    
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 注册成功后跳转到登录页
    // router.push('/login')
  } catch (error: any) {
    errorMessage.value = error.message || '注册失败，请稍后重试'
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

