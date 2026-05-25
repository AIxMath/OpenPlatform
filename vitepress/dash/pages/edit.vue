<script setup lang="ts">
import type { MarkdownEnv } from 'vitepress'
import { useRoute, useRouter } from 'vitepress/client'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import DemoMarkdown from '../../demo.md?raw'
import Editor from '../components/Editor.vue'
import { createMarkdownRenderer } from '../markdown'
import { useAuthStore } from '../stores/auth'
import { trpc } from '../trpc'

const md = createMarkdownRenderer()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const documentSlug = ref<string>('')
const content = ref('Loading...')
const isLoading = ref(true)
const isSaving = ref(false)
const saveMessage = ref('')
const editorRef = ref<any>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const blogData = ref<any>(null)
let autoSaveTimer: number | null = null
let saveMessageTimer: number | null = null

// 移除 YAML front matter
function removeFrontMatter(text: string): string {
  // 检查是否以 --- 开头
  const trimmed = text.trimStart()
  if (trimmed.startsWith('---\n') || trimmed.startsWith('---\r\n')) {
    // 查找第二个 --- 的位置
    const lines = trimmed.split('\n')
    let endIndex = -1

    // 从第二行开始查找结束标记
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i
        break
      }
    }

    if (endIndex > 0) {
      // 返回去除 front matter 后的内容
      return lines.slice(endIndex + 1).join('\n')
    }
  }
  return text
}

// 计算属性：实时渲染 markdown
const renderedMarkdown = ref('')
watch(content, async (content) => {
  // 渲染前去除 front matter
  const cleanContent = removeFrontMatter(content)
  renderedMarkdown.value = await (await md).renderAsync(
    cleanContent,
    {
      path: '/_.md',
      relativePath: '/_.md',
      cleanUrls: true,
    } satisfies MarkdownEnv,
  )
}, { immediate: true })

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
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText && !selectedText.includes('\n')) {
    // 选中单行文本时，转换为标题
    const prefix = '#'.repeat(level)
    // 去除已有的标题标记
    const cleanText = selectedText.replace(/^#+\s*/, '')
    editorRef.value?.replaceSelectedText(`${prefix} ${cleanText}`)
  }
  else if (!selectedText) {
    // 无选中内容时，在当前行开头添加标题标记
    const currentLine = editorRef.value?.getCurrentLineText() || ''
    const prefix = '#'.repeat(level)
    // 去除已有的标题标记
    const cleanText = currentLine.replace(/^#+\s*/, '')
    editorRef.value?.replaceCurrentLine(`${prefix} ${cleanText}`)
  }
  else {
    // 多行选中时，插入标题前缀
    const prefix = `${'#'.repeat(level)} `
    editorRef.value?.insertText(prefix)
  }
}

function insertBold() {
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    editorRef.value?.replaceSelectedText(`**${selectedText}**`)
  }
  else {
    editorRef.value?.insertText('****', -2)
  }
}

function insertItalic() {
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    editorRef.value?.replaceSelectedText(`*${selectedText}*`)
  }
  else {
    editorRef.value?.insertText('**', -1)
  }
}

function insertUnorderedList() {
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    // 为选中的每一行添加列表前缀
    const lines = selectedText.split('\n')
    const formatted = lines.map(line => `- ${line}`).join('\n')
    editorRef.value?.replaceSelectedText(formatted)
  }
  else {
    editorRef.value?.insertText('- ')
  }
}

function insertOrderedList() {
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    // 为选中的每一行添加有序列表前缀
    const lines = selectedText.split('\n')
    const formatted = lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
    editorRef.value?.replaceSelectedText(formatted)
  }
  else {
    editorRef.value?.insertText('1. ')
  }
}

function insertQuote() {
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    // 为选中的每一行添加引用前缀
    const lines = selectedText.split('\n')
    const formatted = lines.map(line => `> ${line}`).join('\n')
    editorRef.value?.replaceSelectedText(formatted)
  }
  else {
    editorRef.value?.insertText('> ')
  }
}

function insertCode() {
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    // 如果选中文本包含换行符，使用代码块格式
    if (selectedText.includes('\n')) {
      editorRef.value?.replaceSelectedText(`\`\`\`\n${selectedText}\n\`\`\``)
    }
    else {
      // 单行文本使用行内代码格式
      editorRef.value?.replaceSelectedText(`\`${selectedText}\``)
    }
  }
  else {
    editorRef.value?.insertText('```\n\n```', -4)
  }
}

function insertLink() {
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    editorRef.value?.replaceSelectedText(`[${selectedText}](url)`)
  }
  else {
    editorRef.value?.insertText('[链接文字](url)', -1)
  }
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
    editorRef.value?.insertText(`![${file.name}](https://news.aixmath.org${response.data.url})`)

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
  const selectedText = editorRef.value?.getSelectedText()
  if (selectedText) {
    // 如果选中文本包含换行符，使用块级公式
    if (selectedText.includes('\n')) {
      editorRef.value?.replaceSelectedText(`$$\n${selectedText}\n$$`)
    }
    else {
      // 单行文本使用行内公式
      editorRef.value?.replaceSelectedText(`$${selectedText}$`)
    }
  }
  else {
    editorRef.value?.insertText('$$\n\n$$', -3)
  }
}

function insertDivider() {
  editorRef.value?.insertText('\n---\n')
}

// 加载文档内容
async function loadDocument(slug: string) {
  try {
    const blog = await trpc.getBlogBySlug.query({ slug })
    blogData.value = blog
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

  if (!documentSlug.value) {
    console.error('文档 slug 不存在')
    return
  }

  isSaving.value = true

  try {
    await trpc.updateBlogBySlug.mutate({
      slug: documentSlug.value,
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

  if (!documentSlug.value) {
    showSaveMessage('文档 slug 不存在')
    return
  }

  isSaving.value = true

  try {
    const result = await trpc.updateBlogBySlug.mutate({
      slug: documentSlug.value,
      content: content.value,
    })

    // 更新 blogData
    if (result.data) {
      blogData.value = result.data
    }

    showSaveMessage('保存成功！')
    return true
  }
  catch (error: any) {
    console.error('保存失败:', error)
    showSaveMessage(error.message || '保存失败，请稍后重试')
    return false
  }
  finally {
    isSaving.value = false
  }
}

// 保存并返回
async function handleSaveAndBack() {
  const success = await handleSave()
  if (success) {
    router.go('/dash/my-blogs')
  }
}

// 保存并预览
async function handleSaveAndPreview() {
  const success = await handleSave()
  if (success && blogData.value) {
    const username = authStore.user?.username || blogData.value.authorName
    const lowercaseUsername = username.toLowerCase()

    if (lowercaseUsername === 'admin') {
      window.open(`/${blogData.value.slug}`, '_blank')
    }
    else {
      window.open(`/${lowercaseUsername}/blog/${blogData.value.slug}`, '_blank')
    }
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
  if (!authStore.isAdmin) {
    router.go('/login')
    return
  }

  const slug = new URLSearchParams(window.location.search).get('slug')

  if (!slug) {
    console.error('未找到文档 slug')
    content.value = `错误：未找到文档 slug\n\n\n${DemoMarkdown}`
    isLoading.value = false
    return
  }

  documentSlug.value = slug
  isLoading.value = true
  content.value = 'Loading...'

  try {
    const doc = await loadDocument(slug)
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
  if (!isLoading.value && documentSlug.value) {
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
  <div class="h-[calc(100vh-var(--vp-nav-height)-64px)] relative flex flex-col overflow-hidden px-10 mx-auto min-w-[800px] min-h-[600px] my-8">
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

      <!-- 保存并返回 -->
      <button
        :disabled="isLoading || isSaving"
        class="toolbar-btn"
        title="保存并返回"
        @click="handleSaveAndBack"
      >
        <div class="i-material-symbols:arrow-back w-5 h-5" />
      </button>

      <!-- 保存并预览 -->
      <!-- <button
        :disabled="isLoading || isSaving"
        class="toolbar-btn"
        title="保存并预览"
        @click="handleSaveAndPreview"
      >
        <div class="i-material-symbols:check w-5 h-5" />
      </button> -->

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
    <main class="flex-1 h-0 overflow-hidden relative flex border border-gray-200">
      <!-- 左侧编辑器 -->
      <div class="flex-1 overflow-hidden">
        <Editor ref="editorRef" v-model="content" />
      </div>

      <!-- 右侧预览 -->
      <div class="flex-1 overflow-auto bg-white vp-doc">
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
