<template>
  <div class="w-screen h-screen flex flex-col overflow-hidden">
    <!-- 头部区域 -->
    <header class="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-200 bg-white">
      <input
        v-model="title"
        type="text"
        :disabled="isLoading"
        class="flex-1 px-3 py-2 text-base sm:text-lg border border-gray-300 rounded-lg outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="请输入标题..."
      >
      <button 
        :disabled="isLoading"
        class="px-4 sm:px-6 py-2 text-sm sm:text-base font-medium text-white bg-blue-500 rounded-lg transition-all hover:bg-blue-600 active:bg-blue-700 active:scale-98 whitespace-nowrap shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:shadow-sm"
        @click="handleSave"
      >
        {{ isLoading ? '加载中...' : '保存' }}
      </button>
    </header>

    <!-- 编辑器容器 -->
    <main class="flex-1 overflow-hidden relative">
      <Editor v-model="content" />
      
      <!-- 加载遮罩层 -->
      <div 
        v-if="isLoading"
        class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 pointer-events-none"
      >
        <div class="text-center">
          <div class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p class="text-gray-600 text-base sm:text-lg font-medium">加载文档中...</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Editor from '../components/Editor.vue'

const route = useRoute()
const documentId = ref<string>('')
const title = ref('')
const content = ref('Loading...')
const isLoading = ref(true)
let autoSaveTimer: number | null = null

// 加载文档内容（留空供后续实现）
const loadDocument = async (id: string) => {
  // TODO: 实现加载文档逻辑
  console.log('加载文档', id)
  
  // 示例：模拟异步加载
  // const response = await fetch(`/api/documents/${id}`)
  // const data = await response.json()
  // return data
  
  return {
    title: '',
    content: ''
  }
}

// 保存函数（留空供后续实现）
const save = async () => {
  if (isLoading.value) {
    console.log('文档加载中，跳过保存')
    return
  }
  
  // TODO: 实现保存逻辑
  console.log('保存', { 
    id: documentId.value,
    title: title.value, 
    content: content.value 
  })
}

// 手动保存
const handleSave = async () => {
  if (isLoading.value) {
    console.log('文档加载中，无法保存')
    return
  }
  await save()
}

// 定时自动保存（每30秒）
const startAutoSave = () => {
  autoSaveTimer = window.setInterval(() => {
    save()
  }, 30000) // 30秒自动保存一次
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 初始化加载文档
const initDocument = async () => {
  const id = route.params.id as string
  
  if (!id) {
    console.error('未找到文档ID')
    content.value = '错误：未找到文档ID'
    isLoading.value = false
    return
  }
  
  documentId.value = id
  isLoading.value = true
  content.value = 'Loading...'
  
  try {
    const doc = await loadDocument(id)
    title.value = doc.title || ''
    content.value = doc.content || ''
  } catch (error) {
    console.error('加载文档失败', error)
    content.value = '加载文档失败，请重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await initDocument()
  // 只在文档加载完成后才启动自动保存
  if (!isLoading.value) {
    startAutoSave()
  }
})

onUnmounted(() => {
  stopAutoSave()
})
</script>

<style scoped>
/* 确保编辑器容器内的Monaco编辑器占满空间 */
:deep(#container) {
  width: 100%;
  height: 100%;
}
</style>
