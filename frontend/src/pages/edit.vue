<template>
  <div class="w-80vw h-[calc(100vh-120px)] flex flex-col overflow-hidden px-10 mt-3 mx-auto min-w-[800px] min-h-[600px] mb-20">
    <!-- 工具栏区域 -->
    <header class="flex-shrink-0 flex items-center gap-1 px-4 py-2 border border-gray-200">
      <!-- 标题类 -->
      <button 
        @click="insertHeading(1)" 
        class="toolbar-btn"
        title="一级标题"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <text x="4" y="18" font-size="16" font-weight="bold" fill="currentColor">H1</text>
        </svg>
      </button>
      
      <button 
        @click="insertHeading(2)" 
        class="toolbar-btn"
        title="二级标题"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <text x="4" y="18" font-size="16" font-weight="bold" fill="currentColor">H2</text>
        </svg>
      </button>
      
      <button 
        @click="insertHeading(3)" 
        class="toolbar-btn"
        title="三级标题"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <text x="4" y="18" font-size="16" font-weight="bold" fill="currentColor">H3</text>
        </svg>
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 文本格式 -->
      <button 
        @click="insertBold" 
        class="toolbar-btn"
        title="加粗"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 4h6a4 4 0 014 4 4 4 0 01-4 4H6V4z M6 12h7a4 4 0 014 4 4 4 0 01-4 4H6v-8z"></path>
        </svg>
      </button>
      
      <button 
        @click="insertItalic" 
        class="toolbar-btn"
        title="斜体"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4h6M8 20h6M13 4L11 20"></path>
        </svg>
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 列表 -->
      <button 
        @click="insertUnorderedList" 
        class="toolbar-btn"
        title="无序列表"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          <circle cx="4" cy="6" r="1.5" fill="currentColor"></circle>
          <circle cx="4" cy="12" r="1.5" fill="currentColor"></circle>
          <circle cx="4" cy="18" r="1.5" fill="currentColor"></circle>
        </svg>
      </button>
      
      <button 
        @click="insertOrderedList" 
        class="toolbar-btn"
        title="有序列表"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13"></path>
          <text x="2" y="9" font-size="10" fill="currentColor">1.</text>
          <text x="2" y="15" font-size="10" fill="currentColor">2.</text>
          <text x="2" y="21" font-size="10" fill="currentColor">3.</text>
        </svg>
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 引用和代码 -->
      <button 
        @click="insertQuote" 
        class="toolbar-btn"
        title="引用"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M3 12h18M3 18h18"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M3 6v12"></path>
        </svg>
      </button>
      
      <button 
        @click="insertCode" 
        class="toolbar-btn"
        title="代码块"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
        </svg>
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 链接和图片 -->
      <button 
        @click="insertLink" 
        class="toolbar-btn"
        title="链接"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
        </svg>
      </button>
      
      <button 
        @click="insertImage" 
        class="toolbar-btn"
        title="图片"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 表格和公式 -->
      <button 
        @click="insertTable" 
        class="toolbar-btn"
        title="表格"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
      
      <button 
        @click="insertFormula" 
        class="toolbar-btn"
        title="公式"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <text x="2" y="16" font-size="14" font-style="italic" fill="currentColor">𝑓(𝑥)</text>
        </svg>
      </button>
      
      <button 
        @click="insertDivider" 
        class="toolbar-btn"
        title="分割线"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path>
        </svg>
      </button>
      
      <div class="flex-1"></div>
      
      <!-- 保存按钮 -->
      <button 
        :disabled="isLoading"
        @click="handleSave"
        class="toolbar-btn"
        title="保存"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
        </svg>
      </button>
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
        ></div>
      </div>
      
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Editor from '../components/Editor.vue'
import MarkdownIt from 'markdown-it'

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,        // 允许 HTML 标签
  linkify: true,     // 自动将 URL 转换为链接
  typographer: true, // 启用智能引号和其他排版替换
  breaks: true,      // 将换行符转换为 <br>
})

const route = useRoute()
const documentId = ref<string>('')
const title = ref('')
const content = ref('Loading...')
const isLoading = ref(true)
const editorRef = ref<any>(null)
let autoSaveTimer: number | null = null

// 计算属性：实时渲染 markdown
const renderedMarkdown = computed(() => {
  return md.render(content.value)
})

// 工具栏插入函数
const insertHeading = (level: number) => {
  const prefix = '#'.repeat(level) + ' '
  editorRef.value?.insertText(prefix)
}

const insertBold = () => {
  editorRef.value?.insertText('****', -2)
}

const insertItalic = () => {
  editorRef.value?.insertText('**', -1)
}

const insertUnorderedList = () => {
  editorRef.value?.insertText('- ')
}

const insertOrderedList = () => {
  editorRef.value?.insertText('1. ')
}

const insertQuote = () => {
  editorRef.value?.insertText('> ')
}

const insertCode = () => {
  editorRef.value?.insertText('```\n\n```', -4)
}

const insertLink = () => {
  editorRef.value?.insertText('[链接文字](url)', -1)
}

const insertImage = () => {
  editorRef.value?.insertText('![图片描述](图片地址)', -1)
}

const insertTable = () => {
  const table = `| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |
`
  editorRef.value?.insertText(table)
}

const insertFormula = () => {
  editorRef.value?.insertText('$$\n\n$$', -3)
}

const insertDivider = () => {
  editorRef.value?.insertText('\n---\n')
}

// 加载文档内容（留空供后续实现）
const loadDocument = async (id: string) => {
  // TODO: 实现加载文档逻辑
  console.log('加载文档', id)
  
  // 示例：模拟异步加载
  await new Promise(resolve => setTimeout(resolve, 5000))
  
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
</style>
