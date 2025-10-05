<script setup lang="ts">
import type { BlogVisibility } from '../../../backend/src/service/blog'
import { useRouter } from 'vitepress/client'
import { ref, watch } from 'vue'
import { trpc } from '../trpc'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

const isCreating = ref(false)
const newBlog = ref({
  title: '',
  visibility: 'public' as 'public' | 'private',
})
const createErrors = ref({
  title: '',
})
const createErrorMessage = ref('')

// 当对话框关闭时重置表单
watch(() => props.show, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

function resetForm() {
  newBlog.value = {
    title: '',
    visibility: 'public',
  }
  createErrors.value = {
    title: '',
  }
  createErrorMessage.value = ''
}

function closeDialog() {
  emit('update:show', false)
}

// 验证创建表单
function validateCreateForm() {
  createErrors.value.title = ''
  createErrorMessage.value = ''

  if (!newBlog.value.title.trim()) {
    createErrors.value.title = '请输入标题'
    return false
  }

  if (newBlog.value.title.length > 200) {
    createErrors.value.title = '标题最多200个字符'
    return false
  }

  return true
}

// 创建文章
async function handleCreate() {
  if (!validateCreateForm())
    return

  isCreating.value = true
  createErrorMessage.value = ''

  try {
    const result = await trpc.createBlog.mutate({
      title: newBlog.value.title,
      content: `# ${newBlog.value.title}\n\n开始编写你的文章...`,
      visibility: newBlog.value.visibility as BlogVisibility,
    })

    closeDialog()

    // 创建成功后直接跳转到编辑页面
    router.go(`/dash/edit?slug=${result.data.slug}`)
  }
  catch (error: any) {
    console.error('创建文章失败:', error)
    createErrorMessage.value = error.message || '创建失败，请稍后重试'
  }
  finally {
    isCreating.value = false
  }
}
</script>

<template>
  <!-- 创建文章对话框 -->
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
    @click.self="closeDialog"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-lg">
      <h2 class="text-xl font-medium text-gray-800 mb-4">
        新建文章
      </h2>

      <form class="space-y-4" @submit.prevent="handleCreate">
        <!-- 标题输入 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            标题
          </label>
          <input
            v-model="newBlog.title"
            type="text"
            placeholder="请输入文章标题"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            :disabled="isCreating"
          >
          <p v-if="createErrors.title" class="mt-1 text-sm text-red-500">
            {{ createErrors.title }}
          </p>
        </div>

        <!-- 可见性选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            可见性
          </label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="newBlog.visibility"
                type="radio"
                value="public"
                class="w-4 h-4"
                :disabled="isCreating"
              >
              <span class="text-sm text-gray-700">公开</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="newBlog.visibility"
                type="radio"
                value="private"
                class="w-4 h-4"
                :disabled="isCreating"
              >
              <span class="text-sm text-gray-700">私密</span>
            </label>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="createErrorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">
            {{ createErrorMessage }}
          </p>
        </div>

        <!-- 按钮 -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            :disabled="isCreating"
            @click="closeDialog"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isCreating"
            class="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-md font-medium hover:bg-gray-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <div v-if="isCreating" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isCreating ? '创建中...' : '创建' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
