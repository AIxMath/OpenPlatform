<template>
  <div class="w-80vw h-[calc(100vh-120px)] flex flex-col overflow-hidden px-10 mt-3 mx-auto min-w-[800px] min-h-[600px] mb-20">
    <!-- 工具栏区域 -->
    <header class="flex-shrink-0 flex items-center gap-1 px-4 py-2 border border-gray-200">
      <!-- 标题类 -->
      <button 
        :disabled="isLoading"
        @click="insertHeading(1)" 
        class="toolbar-btn"
        title="一级标题"
      >
        <div class="i-material-symbols:format-h1 w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertHeading(2)" 
        class="toolbar-btn"
        title="二级标题"
      >
        <div class="i-material-symbols:format-h2 w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertHeading(3)" 
        class="toolbar-btn"
        title="三级标题"
      >
        <div class="i-material-symbols:format-h3 w-5 h-5" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 文本格式 -->
      <button 
        :disabled="isLoading"
        @click="insertBold" 
        class="toolbar-btn"
        title="加粗"
      >
        <div class="i-material-symbols:format-bold w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertItalic" 
        class="toolbar-btn"
        title="斜体"
      >
        <div class="i-material-symbols:format-italic w-5 h-5" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 列表 -->
      <button 
        :disabled="isLoading"
        @click="insertUnorderedList" 
        class="toolbar-btn"
        title="无序列表"
      >
        <div class="i-material-symbols:format-list-bulleted w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertOrderedList" 
        class="toolbar-btn"
        title="有序列表"
      >
        <div class="i-material-symbols:format-list-numbered w-5 h-5" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 引用和代码 -->
      <button 
        :disabled="isLoading"
        @click="insertQuote" 
        class="toolbar-btn"
        title="引用"
      >
        <div class="i-material-symbols:format-quote w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertCode" 
        class="toolbar-btn"
        title="代码块"
      >
        <div class="i-material-symbols:code w-5 h-5" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 链接和图片 -->
      <button 
        :disabled="isLoading"
        @click="insertLink" 
        class="toolbar-btn"
        title="链接"
      >
        <div class="i-material-symbols:link w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertImage" 
        class="toolbar-btn"
        title="图片"
      >
        <div class="i-material-symbols:image w-5 h-5" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- 表格和公式 -->
      <button 
        :disabled="isLoading"
        @click="insertTable" 
        class="toolbar-btn"
        title="表格"
      >
        <div class="i-material-symbols:table w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertFormula" 
        class="toolbar-btn"
        title="公式"
      >
        <div class="i-material-symbols:functions w-5 h-5" />
      </button>
      
      <button 
        :disabled="isLoading"
        @click="insertDivider" 
        class="toolbar-btn"
        title="分割线"
      >
        <div class="i-material-symbols:horizontal-rule w-5 h-5" />
      </button>
      
      <div class="flex-1"></div>
      
      <!-- 保存按钮 -->
      <button 
        :disabled="isLoading"
        @click="handleSave"
        class="toolbar-btn"
        title="保存"
      >
        <div class="i-material-symbols:save w-5 h-5" />
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
        class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10"
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
  
  return ''
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
    content.value = doc || ''
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
