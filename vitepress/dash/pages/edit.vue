<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { useRoute, useRouter } from 'vitepress/client'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Editor from '../components/Editor.vue'
import { useAuthStore } from '../stores/auth'
import { trpc } from '../trpc'

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true, // 允许 HTML 标签
  linkify: true, // 自动将 URL 转换为链接
  typographer: true, // 启用智能引号和其他排版替换
  breaks: true, // 将换行符转换为 <br>
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const documentId = ref<string>('')
const content = ref('Loading...')
const isLoading = ref(true)
const isSaving = ref(false)
const saveMessage = ref('')
const editorRef = ref<any>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
let autoSaveTimer: number | null = null
let saveMessageTimer: number | null = null

// 计算属性：实时渲染 markdown
const renderedMarkdown = computed(() => {
  return md.render(content.value)
})

// 显示提示消息
function showSaveMessage(message: string, duration: number = 3000) {
  saveMessage.value = message

  // 清除之前的定时器
  if (saveMessageTimer) {
    clearTimeout(saveMessageTimer)
  }

  // 设置新的定时器自动隐藏消息
  saveMessageTimer = window.setTimeout(() => {
    saveMessage.value = ''
  }, duration)
}

// 工具栏插入函数
function insertHeading(level: number) {
  const prefix = `${'#'.repeat(level)} `
  editorRef.value?.insertText(prefix)
}

function insertBold() {
  editorRef.value?.insertText('****', -2)
}

function insertItalic() {
  editorRef.value?.insertText('**', -1)
}

function insertUnorderedList() {
  editorRef.value?.insertText('- ')
}

function insertOrderedList() {
  editorRef.value?.insertText('1. ')
}

function insertQuote() {
  editorRef.value?.insertText('> ')
}

function insertCode() {
  editorRef.value?.insertText('```\n\n```', -4)
}

function insertLink() {
  editorRef.value?.insertText('[链接文字](url)', -1)
}

function insertImage() {
  // 触发文件选择
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      await handleImageUpload(file)
    }
  }
  input.click()
}

// 处理图片上传
async function handleImageUpload(file: File) {
  if (isLoading.value)
    return

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showSaveMessage('文件大小不能超过 10MB')
    return
  }

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showSaveMessage('只能上传图片文件')
    return
  }

  try {
    showSaveMessage('正在上传图片...')

    // 读取文件为 Base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // 移除 data:image/xxx;base64, 前缀
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // 上传到服务器
    const response = await trpc.uploadFile.mutate({
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      data: base64,
    })

    // 插入 Markdown 图片语法
    const imageUrl = `http://localhost:3000${response.data.url}`
    // editorRef.value?.insertText(`![${file.name}](${imageUrl})`)

    showSaveMessage('图片上传成功')
  }
  catch (error: any) {
    console.error('上传图片失败:', error)
    showSaveMessage(error.message || '上传失败，请稍后重试')
  }
}

function insertTable() {
  const table = `| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |
`
  editorRef.value?.insertText(table)
}

function insertFormula() {
  editorRef.value?.insertText('$$\n\n$$', -3)
}

function insertDivider() {
  editorRef.value?.insertText('\n---\n')
}

// 加载文档内容
async function loadDocument(id: string) {
  try {
    const blog = await trpc.getBlogById.query({ blogId: id })
    return blog.content
  }
  catch (error: any) {
    console.error('加载文档失败:', error)
    throw new Error(error.message || '加载文档失败')
  }
}

// 保存函数
async function save() {
  if (isLoading.value || isSaving.value) {
    return
  }

  if (!documentId.value) {
    console.error('文档ID不存在')
    return
  }

  isSaving.value = true

  try {
    await trpc.updateBlog.mutate({
      blogId: documentId.value,
      content: content.value,
    })

    console.log('自动保存成功')
  }
  catch (error: any) {
    console.error('保存失败:', error)
    // 自动保存失败时不显示错误提示，避免打扰用户
  }
  finally {
    isSaving.value = false
  }
}

// 手动保存
async function handleSave() {
  if (isLoading.value || isSaving.value) {
    return
  }

  if (!documentId.value) {
    showSaveMessage('文档ID不存在')
    return
  }

  isSaving.value = true

  try {
    await trpc.updateBlog.mutate({
      blogId: documentId.value,
      content: content.value,
    })

    showSaveMessage('保存成功！')
  }
  catch (error: any) {
    console.error('保存失败:', error)
    showSaveMessage(error.message || '保存失败，请稍后重试')
  }
  finally {
    isSaving.value = false
  }
}

// 定时自动保存（每30秒）
function startAutoSave() {
  autoSaveTimer = window.setInterval(() => {
    save()
  }, 30000) // 30秒自动保存一次
}

function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 初始化加载文档
async function initDocument() {
  // 检查是否登录
  if (!authStore.isAuthenticated) {
    router.go('/login')
    return
  }

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
    content.value = doc || ''
  }
  catch (error: any) {
    console.error('加载文档失败', error)
    content.value = '加载文档失败，请重试'
    showSaveMessage(error.message || '加载文档失败')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await initDocument()
  // 只在文档加载完成后才启动自动保存
  if (!isLoading.value && documentId.value) {
    startAutoSave()
  }
})

onUnmounted(() => {
  stopAutoSave()
  if (saveMessageTimer) {
    clearTimeout(saveMessageTimer)
  }
})
</script>

<template>
  <div class="w-80vw h-[calc(100vh-120px)] flex flex-col overflow-hidden px-10 mt-3 mx-auto min-w-[800px] min-h-[600px] mb-20">
    <!-- 工具栏区域 -->
    <header class="flex-shrink-0 flex items-center gap-1 px-4 py-2 border border-gray-200">
      <!-- 标题类 -->
      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="一级标题"
        @click="insertHeading(1)"
      >
        <div class="i-material-symbols:format-h1 w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="二级标题"
        @click="insertHeading(2)"
      >
        <div class="i-material-symbols:format-h2 w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="三级标题"
        @click="insertHeading(3)"
      >
        <div class="i-material-symbols:format-h3 w-5 h-5" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- 文本格式 -->
      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="加粗"
        @click="insertBold"
      >
        <div class="i-material-symbols:format-bold w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="斜体"
        @click="insertItalic"
      >
        <div class="i-material-symbols:format-italic w-5 h-5" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- 列表 -->
      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="无序列表"
        @click="insertUnorderedList"
      >
        <div class="i-material-symbols:format-list-bulleted w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="有序列表"
        @click="insertOrderedList"
      >
        <div class="i-material-symbols:format-list-numbered w-5 h-5" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- 引用和代码 -->
      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="引用"
        @click="insertQuote"
      >
        <div class="i-material-symbols:format-quote w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="代码块"
        @click="insertCode"
      >
        <div class="i-material-symbols:code w-5 h-5" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- 链接和图片 -->
      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="链接"
        @click="insertLink"
      >
        <div class="i-material-symbols:link w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="图片"
        @click="insertImage"
      >
        <div class="i-material-symbols:image w-5 h-5" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- 表格和公式 -->
      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="表格"
        @click="insertTable"
      >
        <div class="i-material-symbols:table w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="公式"
        @click="insertFormula"
      >
        <div class="i-material-symbols:functions w-5 h-5" />
      </button>

      <button
        :disabled="isLoading"
        class="toolbar-btn"
        title="分割线"
        @click="insertDivider"
      >
        <div class="i-material-symbols:horizontal-rule w-5 h-5" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- 保存按钮 -->
      <button
        :disabled="isLoading || isSaving"
        class="toolbar-btn"
        :title="isSaving ? '保存中...' : '保存'"
        @click="handleSave"
      >
        <div
          v-if="isSaving"
          class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
        <div v-else class="i-material-symbols:save w-5 h-5" />
      </button>

      <div class="flex-1" />

      <!-- 保存提示消息 -->
      <transition name="fade">
        <div
          v-if="saveMessage"
          class="px-3 py-1 bg-gray-800 text-white text-sm rounded-md flex items-center gap-2"
        >
          <div class="i-material-symbols:check-circle w-4 h-4" />
          <span>{{ saveMessage }}</span>
        </div>
      </transition>
    </header>

    <!-- 编辑器容器 - 左右分栏 -->
    <main class="flex-1 overflow-hidden relative flex border border-gray-200">
      <!-- 左侧编辑器 -->
      <div class="flex-1 overflow-hidden">
        <Editor ref="editorRef" v-model="content" />
      </div>

      <!-- 右侧预览 -->
      <div class="flex-1 overflow-auto bg-white">
        <div
          class="max-w-4xl mx-auto pt-2 px-8 markdown-preview"
          v-html="renderedMarkdown"
        />
      </div>

      <!-- 加载遮罩层 -->
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10"
      >
        <div class="text-center">
          <div class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p class="text-gray-600 text-base sm:text-lg font-medium">
            加载文档中...
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 工具栏按钮样式 */
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 4px;
  color: #4b5563;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #1f2937;
}

.toolbar-btn:active:not(:disabled) {
  background-color: #e5e7eb;
  transform: scale(0.95);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 确保编辑器容器内的Monaco编辑器占满空间 */
:deep(#container) {
  width: 100%;
  height: 100%;
}

/* Markdown 预览样式 */
:deep(.markdown-preview) {
  line-height: 1.75;
  color: #374151;
}

:deep(.markdown-preview h1) {
  font-size: 2.25rem;
  font-weight: 800;
  margin-top: 2rem;
  margin-bottom: 1rem;
  line-height: 1.2;
  color: #111827;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

:deep(.markdown-preview h2) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 1.75rem;
  margin-bottom: 0.875rem;
  line-height: 1.3;
  color: #1f2937;
}

:deep(.markdown-preview h3) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  color: #374151;
}

:deep(.markdown-preview h4),
:deep(.markdown-preview h5),
:deep(.markdown-preview h6) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.625rem;
  color: #4b5563;
}

:deep(.markdown-preview p) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

:deep(.markdown-preview a) {
  color: #3b82f6;
  text-decoration: underline;
  transition: color 0.2s;
}

:deep(.markdown-preview a:hover) {
  color: #2563eb;
}

:deep(.markdown-preview code) {
  background-color: #f3f4f6;
  color: #ec4899;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Courier New', Courier, monospace;
}

:deep(.markdown-preview pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

:deep(.markdown-preview pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: 0.875rem;
}

:deep(.markdown-preview ul),
:deep(.markdown-preview ol) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

:deep(.markdown-preview li) {
  margin-top: 0.375rem;
  margin-bottom: 0.375rem;
}

:deep(.markdown-preview blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin-left: 0;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: #6b7280;
  font-style: italic;
}

:deep(.markdown-preview table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.markdown-preview th),
:deep(.markdown-preview td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

:deep(.markdown-preview th) {
  background-color: #f9fafb;
  font-weight: 600;
}

:deep(.markdown-preview tr:nth-child(even)) {
  background-color: #f9fafb;
}

:deep(.markdown-preview img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.markdown-preview hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin-top: 2rem;
  margin-bottom: 2rem;
}

/* 淡入淡出过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
