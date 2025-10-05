<script setup lang="ts">
import { useRouter } from 'vitepress/client'
import { onMounted, reactive, ref } from 'vue'
import UserAvatar from '../components/UserAvatar.vue'
import { useAuthStore } from '../stores/auth'
import { trpc } from '../trpc'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const isSaving = ref(false)
const isUploadingAvatar = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const avatarSuccessMessage = ref('') // 头像区域专用的成功消息
const fileInputRef = ref<HTMLInputElement | null>(null)

// 个人资料表单
const profileForm = reactive({
  avatar: '',
  bio: '',
  github: '',
  contactEmail: '',
})

// 验证错误
const errors = reactive({
  bio: '',
  github: '',
  contactEmail: '',
})

// 加载用户个人资料
async function loadProfile() {
  isLoading.value = true
  try {
    const user = await trpc.getMe.query()
    if (user.profile) {
      profileForm.avatar = user.profile.avatar || ''
      profileForm.bio = user.profile.bio || ''
      profileForm.github = user.profile.github || ''
      profileForm.contactEmail = user.profile.contactEmail || ''
    }
  }
  catch (error: any) {
    console.error('加载个人资料失败:', error)
    errorMessage.value = error.message || '加载失败'
  }
  finally {
    isLoading.value = false
  }
}

// 验证表单
function validateForm(): boolean {
  errors.bio = ''
  errors.github = ''
  errors.contactEmail = ''
  errorMessage.value = ''

  if (profileForm.bio && profileForm.bio.length > 500) {
    errors.bio = '个人简介最多500个字符'
    return false
  }

  if (profileForm.github && profileForm.github.length > 100) {
    errors.github = 'GitHub 用户名最多100个字符'
    return false
  }

  if (profileForm.contactEmail && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(profileForm.contactEmail)) {
    errors.contactEmail = '请输入有效的邮箱地址'
    return false
  }

  return true
}

// 保存个人资料（不包括头像，头像已经自动保存）
async function handleSave() {
  if (!validateForm())
    return

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await trpc.updateProfile.mutate({
      bio: profileForm.bio || undefined,
      github: profileForm.github || undefined,
      contactEmail: profileForm.contactEmail || undefined,
    })

    successMessage.value = '基本信息保存成功！'

    // 更新 store 中的用户信息
    const updatedUser = await trpc.getMe.query()
    if (authStore.user && updatedUser) {
      authStore.user = { ...authStore.user, ...updatedUser }
    }

    // 3秒后清除成功消息
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
  catch (error: any) {
    console.error('保存失败:', error)
    errorMessage.value = error.message || '保存失败，请稍后重试'
  }
  finally {
    isSaving.value = false
  }
}

// 触发文件选择
function triggerFileInput() {
  fileInputRef.value?.click()
}

// 处理文件上传
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file)
    return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    errorMessage.value = '请选择图片文件'
    return
  }

  // 验证文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = '图片大小不能超过 2MB'
    return
  }

  isUploadingAvatar.value = true
  errorMessage.value = ''
  avatarSuccessMessage.value = ''

  // 读取文件为 Base64
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const base64Data = e.target?.result as string

      // 上传文件
      const result = await trpc.uploadFile.mutate({
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        data: base64Data,
      })

      // 更新头像路径
      const newAvatarPath = `/files/${result.data.filename}`
      profileForm.avatar = newAvatarPath

      // 自动保存头像到个人资料
      await trpc.updateProfile.mutate({
        avatar: newAvatarPath,
      })

      // 更新 store 中的用户信息
      const updatedUser = await trpc.getMe.query()
      if (authStore.user && updatedUser) {
        authStore.user = { ...authStore.user, ...updatedUser }
      }

      avatarSuccessMessage.value = '头像已保存！'

      setTimeout(() => {
        avatarSuccessMessage.value = ''
      }, 3000)
    }
    catch (error: any) {
      console.error('上传失败:', error)
      errorMessage.value = error.message || '上传失败，请稍后重试'
    }
    finally {
      isUploadingAvatar.value = false
    }
  }

  reader.onerror = () => {
    errorMessage.value = '读取文件失败'
    isUploadingAvatar.value = false
  }

  reader.readAsDataURL(file)

  // 重置 input
  if (target)
    target.value = ''
}

// 使用默认头像（首字母）
async function useDefaultAvatar() {
  try {
    profileForm.avatar = ''

    // 自动保存到个人资料
    await trpc.updateProfile.mutate({
      avatar: '',
    })

    // 更新 store 中的用户信息
    const updatedUser = await trpc.getMe.query()
    if (authStore.user && updatedUser) {
      authStore.user = { ...authStore.user, ...updatedUser }
    }

    avatarSuccessMessage.value = '已设置为首字母头像！'
    setTimeout(() => {
      avatarSuccessMessage.value = ''
    }, 3000)
  }
  catch (error: any) {
    console.error('设置失败:', error)
    errorMessage.value = error.message || '设置失败，请稍后重试'
  }
}

// 返回个人主页
function goBack() {
  router.go('/dash/user')
}

onMounted(async () => {
  // 检查是否登录
  if (!authStore.isAuthenticated) {
    router.go('/dash/login')
    return
  }

  await loadProfile()
})
</script>

<template>
  <div class="profile-page">
    <div class="container">
      <div class="header">
        <button class="back-button" @click="goBack">
          <div class="i-material-symbols:arrow-back w-5 h-5" />
          <span>返回</span>
        </button>
        <h1 class="title">
          编辑个人资料
        </h1>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="spinner" />
        <p>加载中...</p>
      </div>

      <div v-else class="content">
        <!-- 头像设置 -->
        <div class="section">
          <h2 class="section-title">
            头像
          </h2>
          <div class="avatar-section">
            <div class="avatar-preview">
              <UserAvatar
                :src="profileForm.avatar || null"
                :username="authStore.user?.username || ''"
                size="large"
              />
              <div v-if="isUploadingAvatar" class="avatar-loading">
                <div class="spinner-small" />
              </div>
            </div>
            <div class="avatar-actions">
              <button
                type="button"
                class="button button-primary"
                :disabled="isUploadingAvatar"
                @click="triggerFileInput"
              >
                <div class="i-material-symbols:upload w-5 h-5" />
                <span>上传头像</span>
              </button>
              <button
                type="button"
                class="button button-secondary"
                @click="useDefaultAvatar"
              >
                <div class="i-material-symbols:person-outline w-5 h-5" />
                <span>使用首字母头像</span>
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="file-input"
                @change="handleFileChange"
              >
              <p class="hint">
                支持 JPG、PNG、GIF 格式，大小不超过 2MB
              </p>
            </div>
          </div>
        </div>

        <!-- 头像上传成功消息 -->
        <div v-if="avatarSuccessMessage" class="message message-success">
          <div class="i-material-symbols:check-circle w-5 h-5" />
          <span>{{ avatarSuccessMessage }}</span>
        </div>

        <!-- 个人信息 -->
        <div class="section">
          <h2 class="section-title">
            基本信息
          </h2>
          <form class="form" @submit.prevent="handleSave">
            <!-- 个人简介 -->
            <div class="form-group">
              <label class="label">
                个人简介
              </label>
              <textarea
                v-model="profileForm.bio"
                placeholder="介绍一下你自己..."
                class="textarea"
                :class="{ error: errors.bio }"
                rows="4"
                maxlength="500"
              />
              <div class="form-footer">
                <p v-if="errors.bio" class="error-text">
                  {{ errors.bio }}
                </p>
                <p class="char-count">
                  {{ profileForm.bio.length }} / 500
                </p>
              </div>
            </div>

            <!-- GitHub 用户名 -->
            <div class="form-group">
              <label class="label">
                GitHub 用户名
              </label>
              <input
                v-model="profileForm.github"
                type="text"
                placeholder="your-github-username"
                class="input"
                :class="{ error: errors.github }"
                maxlength="100"
              >
              <p v-if="errors.github" class="error-text">
                {{ errors.github }}
              </p>
              <p class="hint">
                不需要包含 @ 符号
              </p>
            </div>

            <!-- 联系邮箱 -->
            <div class="form-group">
              <label class="label">
                联系邮箱
              </label>
              <input
                v-model="profileForm.contactEmail"
                type="email"
                placeholder="contact@example.com"
                class="input"
                :class="{ error: errors.contactEmail }"
              >
              <p v-if="errors.contactEmail" class="error-text">
                {{ errors.contactEmail }}
              </p>
              <p class="hint">
                用于文章底部显示的联系方式（可选）
              </p>
            </div>

            <!-- 提交按钮 -->
            <div class="form-actions">
              <button
                type="submit"
                class="button button-primary button-large"
                :disabled="isSaving"
              >
                <div v-if="isSaving" class="spinner-small" />
                <span>{{ isSaving ? '保存中...' : '保存基本信息' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 基本信息保存成功消息 -->
        <div v-if="successMessage" class="message message-success">
          <div class="i-material-symbols:check-circle w-5 h-5" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- 错误消息 -->
        <div v-if="errorMessage" class="message message-error">
          <div class="i-material-symbols:error-outline w-5 h-5" />
          <span>{{ errorMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 2rem 1rem;
}

.container {
  max-width: 720px;
  margin: 0 auto;
}

.header {
  margin-bottom: 1.5rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.back-button:hover {
  border-color: #d1d5db;
  color: #1f2937;
  background: #fafafa;
}

.title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #1f2937;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.avatar-section {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.avatar-preview {
  position: relative;
  flex-shrink: 0;
}

.avatar-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.avatar-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-input {
  display: none;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #4b5563;
}

.input,
.textarea {
  padding: 0.625rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: #fafafa;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #d1d5db;
  background: white;
}

.input.error,
.textarea.error {
  border-color: #ef4444;
}

.textarea {
  resize: vertical;
  min-height: 100px;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.char-count {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
  margin: 0;
}

.message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

.message-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.message-success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.form-actions {
  padding-top: 1rem;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  background: #1f2937;
  color: white;
  border-color: #1f2937;
}

.button-primary:hover:not(:disabled) {
  background: #374151;
}

.button-secondary {
  background: transparent;
  color: #6b7280;
  border-color: #e5e7eb;
}

.button-secondary:hover:not(:disabled) {
  background: #f9fafb;
  color: #1f2937;
  border-color: #d1d5db;
}

.button-large {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  width: 100%;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem 0.5rem;
  }

  .container {
    max-width: 100%;
  }

  .section {
    padding: 1.25rem;
  }

  .section-title {
    font-size: 0.8125rem;
  }

  .avatar-section {
    flex-direction: column;
    align-items: center;
  }

  .avatar-actions {
    width: 100%;
  }

  .title {
    font-size: 1.5rem;
  }
}
</style>
