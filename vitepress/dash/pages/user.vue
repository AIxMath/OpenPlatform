<script setup lang="ts">
import { useRouter } from 'vitepress/client'
import { computed, onMounted, reactive, ref } from 'vue'
import CreateBlogDialog from '../components/CreateBlogDialog.vue'
import { useAuthStore } from '../stores/auth'
import { trpc } from '../trpc'

const router = useRouter()
const authStore = useAuthStore()

// 创建博客对话框
const showCreateBlogDialog = ref(false)

// 修改密码对话框
const showPasswordDialog = ref(false)
const isChangingPassword = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordErrors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordErrorMessage = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 博客统计
const blogStats = ref({
  total: 0,
  public: 0,
  private: 0,
})
const isLoadingStats = ref(false)

// 计算用户加入天数
const joinedDays = computed(() => {
  if (!authStore.user?.createdAt)
    return 0
  const now = new Date()
  const created = new Date(authStore.user.createdAt)
  const diff = now.getTime() - created.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 加载博客统计
async function loadBlogStats() {
  isLoadingStats.value = true
  try {
    const stats = await trpc.getMyBlogStats.query()
    blogStats.value = stats
  }
  catch (error: any) {
    console.error('加载博客统计失败:', error)
  }
  finally {
    isLoadingStats.value = false
  }
}

// 验证密码表单
function validatePasswordForm() {
  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''
  passwordErrorMessage.value = ''

  let isValid = true

  if (!passwordForm.oldPassword) {
    passwordErrors.oldPassword = '请输入当前密码'
    isValid = false
  }

  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = '请输入新密码'
    isValid = false
  }
  else if (passwordForm.newPassword.length < 8) {
    passwordErrors.newPassword = '密码至少需要8个字符'
    isValid = false
  }
  else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
    passwordErrors.newPassword = '密码必须包含大小写字母和数字'
    isValid = false
  }

  if (!passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = '请确认新密码'
    isValid = false
  }
  else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  if (passwordForm.oldPassword === passwordForm.newPassword) {
    passwordErrors.newPassword = '新密码不能与当前密码相同'
    isValid = false
  }

  return isValid
}

// 修改密码
async function handleChangePassword() {
  if (!validatePasswordForm())
    return

  isChangingPassword.value = true
  passwordErrorMessage.value = ''

  try {
    await trpc.changePassword.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })

    // 重置表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    showPasswordDialog.value = false

    // 提示成功
    alert('密码修改成功，请重新登录')

    // 登出并跳转到登录页
    authStore.logout()
    router.go('/dash/login')
  }
  catch (error: any) {
    console.error('修改密码失败:', error)
    passwordErrorMessage.value = error.message || '修改密码失败，请检查当前密码是否正确'
  }
  finally {
    isChangingPassword.value = false
  }
}

// 登出
function handleLogout() {
  authStore.logout()
  router.go('/dash/login')
}

// 导航到我的博客
function goToMyBlogs() {
  router.go('/dash/my-blogs')
}

// 打开创建博客对话框
function goToCreateBlog() {
  showCreateBlogDialog.value = true
}

// 导航到探索页面
function goToExplore() {
  router.go('/dash/explore')
}

onMounted(() => {
  // 检查是否登录
  if (!authStore.isAuthenticated) {
    router.go('/dash/login')
    return
  }

  loadBlogStats()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-2xl font-light text-gray-800">
          用户中心
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          管理你的账户和内容
        </p>
      </div>

      <!-- 用户信息卡片 -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-4">
            <!-- 用户头像（使用首字母） -->
            <div class="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center text-2xl font-medium">
              {{ authStore.user?.username.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-xl font-medium text-gray-800">
                {{ authStore.user?.username }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ authStore.user?.email }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span
                  :class="authStore.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                  class="px-2 py-0.5 text-xs rounded-full"
                >
                  {{ authStore.isAdmin ? '管理员' : '用户' }}
                </span>
                <span class="text-xs text-gray-500">
                  加入 {{ joinedDays }} 天
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户统计 -->
        <div class="border-t border-gray-200 pt-4 mt-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-light text-gray-800">
                {{ isLoadingStats ? '-' : blogStats.total }}
              </div>
              <div class="text-sm text-gray-500 mt-1">
                总文章数
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-light text-gray-800">
                {{ isLoadingStats ? '-' : blogStats.public }}
              </div>
              <div class="text-sm text-gray-500 mt-1">
                公开文章
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-light text-gray-800">
                {{ isLoadingStats ? '-' : blogStats.private }}
              </div>
              <div class="text-sm text-gray-500 mt-1">
                私密文章
              </div>
            </div>
          </div>
        </div>

        <!-- 账户信息 -->
        <div class="border-t border-gray-200 pt-4 mt-4">
          <div class="text-xs text-gray-500">
            账户创建于 {{ formatDate(authStore.user?.createdAt || '') }}
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="mb-6">
        <h2 class="text-lg font-medium text-gray-800 mb-3">
          快速操作
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 创建博客卡片 -->
          <button
            class="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-all text-left group"
            @click="goToCreateBlog"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <div class="i-material-symbols:add w-6 h-6 text-gray-600 group-hover:text-white" />
              </div>
              <h3 class="text-lg font-medium text-gray-800">
                创建博客
              </h3>
            </div>
            <p class="text-sm text-gray-600">
              开始写作，分享你的想法和知识
            </p>
          </button>

          <!-- 查看博客列表卡片 -->
          <button
            class="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-all text-left group"
            @click="goToMyBlogs"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <div class="i-material-symbols:article-outline w-6 h-6 text-gray-600 group-hover:text-white" />
              </div>
              <h3 class="text-lg font-medium text-gray-800">
                我的博客
              </h3>
            </div>
            <p class="text-sm text-gray-600">
              管理和编辑你的所有博客文章
            </p>
          </button>

          <!-- 探索页面卡片 -->
          <button
            class="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-all text-left group"
            @click="goToExplore"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <div class="i-material-symbols:explore-outline w-6 h-6 text-gray-600 group-hover:text-white" />
              </div>
              <h3 class="text-lg font-medium text-gray-800">
                探索
              </h3>
            </div>
            <p class="text-sm text-gray-600">
              发现社区中其他用户的精彩内容
            </p>
          </button>
        </div>
      </div>

      <!-- 账户设置 -->
      <div>
        <h2 class="text-lg font-medium text-gray-800 mb-3">
          账户设置
        </h2>
        <div class="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          <!-- 修改密码 -->
          <button
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            @click="showPasswordDialog = true"
          >
            <div class="flex items-center gap-3">
              <div class="i-material-symbols:lock-outline w-5 h-5 text-gray-600" />
              <div>
                <div class="text-sm font-medium text-gray-800">
                  修改密码
                </div>
                <div class="text-xs text-gray-500">
                  更改你的登录密码
                </div>
              </div>
            </div>
            <div class="i-material-symbols:chevron-right w-5 h-5 text-gray-400" />
          </button>

          <!-- 登出 -->
          <button
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            @click="handleLogout"
          >
            <div class="flex items-center gap-3">
              <div class="i-material-symbols:logout w-5 h-5 text-red-600" />
              <div>
                <div class="text-sm font-medium text-red-600">
                  退出登录
                </div>
                <div class="text-xs text-gray-500">
                  安全退出当前账户
                </div>
              </div>
            </div>
            <div class="i-material-symbols:chevron-right w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <div
      v-if="showPasswordDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
      @click.self="showPasswordDialog = false"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 class="text-xl font-medium text-gray-800 mb-4">
          修改密码
        </h2>

        <form class="space-y-4" @submit.prevent="handleChangePassword">
          <!-- 当前密码 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              当前密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:lock-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="passwordForm.oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                placeholder="请输入当前密码"
                class="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                :disabled="isChangingPassword"
              >
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                :disabled="isChangingPassword"
                @click="showOldPassword = !showOldPassword"
              >
                <div
                  :class="showOldPassword ? 'i-material-symbols:visibility-off-outline' : 'i-material-symbols:visibility-outline'"
                  class="w-5 h-5"
                />
              </button>
            </div>
            <p v-if="passwordErrors.oldPassword" class="mt-1 text-sm text-red-500">
              {{ passwordErrors.oldPassword }}
            </p>
          </div>

          <!-- 新密码 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              新密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:lock-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="请输入新密码"
                class="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                :disabled="isChangingPassword"
              >
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                :disabled="isChangingPassword"
                @click="showNewPassword = !showNewPassword"
              >
                <div
                  :class="showNewPassword ? 'i-material-symbols:visibility-off-outline' : 'i-material-symbols:visibility-outline'"
                  class="w-5 h-5"
                />
              </button>
            </div>
            <p v-if="passwordErrors.newPassword" class="mt-1 text-sm text-red-500">
              {{ passwordErrors.newPassword }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              密码至少8个字符，包含大小写字母和数字
            </p>
          </div>

          <!-- 确认新密码 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              确认新密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="i-material-symbols:lock-outline w-5 h-5 text-gray-400" />
              </div>
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="请再次输入新密码"
                class="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                :disabled="isChangingPassword"
              >
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                :disabled="isChangingPassword"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <div
                  :class="showConfirmPassword ? 'i-material-symbols:visibility-off-outline' : 'i-material-symbols:visibility-outline'"
                  class="w-5 h-5"
                />
              </button>
            </div>
            <p v-if="passwordErrors.confirmPassword" class="mt-1 text-sm text-red-500">
              {{ passwordErrors.confirmPassword }}
            </p>
          </div>

          <!-- 错误提示 -->
          <div v-if="passwordErrorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">
              {{ passwordErrorMessage }}
            </p>
          </div>

          <!-- 按钮 -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              :disabled="isChangingPassword"
              @click="showPasswordDialog = false"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isChangingPassword"
              class="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-md font-medium hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <div v-if="isChangingPassword" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{{ isChangingPassword ? '修改中...' : '确认修改' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 创建博客对话框 -->
    <CreateBlogDialog v-model:show="showCreateBlogDialog" />
  </div>
</template>

<style scoped>
/* 输入框自动填充样式覆盖 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px white inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
