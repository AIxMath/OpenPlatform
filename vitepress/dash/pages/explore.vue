<script setup lang="ts">
import { useRouter } from 'vitepress/client'
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { trpc } from '../trpc'

const router = useRouter()
const authStore = useAuthStore()

interface Blog {
  _id: string
  title: string
  slug: string
  content: string
  visibility: 'public' | 'private'
  pinned: boolean
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}

// 文章列表数据
const blogs = ref<Blog[]>([])
const total = ref(0)
const currentPage = ref(1)
const totalPages = ref(0)
const pageSize = 10
const isLoading = ref(false)

// 搜索相关
const searchQuery = ref('')
const isSearching = ref(false)
const hasSearched = ref(false) // 标记是否已执行搜索

// 计算显示的页码
const displayPages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    // 总页数小于等于7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  }
  else {
    // 总页数大于7，显示省略号
    if (current <= 4) {
      // 当前页在前面
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
    else if (current >= total - 3) {
      // 当前页在后面
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    }
    else {
      // 当前页在中间
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

// 加载文章列表
async function loadBlogs() {
  isLoading.value = true
  try {
    let response
    // 根据是否有搜索词决定调用哪个接口
    if (searchQuery.value.trim()) {
      response = await trpc.searchPublicBlogs.query({
        query: searchQuery.value.trim(),
        page: currentPage.value,
        limit: pageSize,
      })
    }
    else {
      response = await trpc.getPublicBlogs.query({
        page: currentPage.value,
        limit: pageSize,
        excludeAdmin: true, // 排除admin用户
      })
    }

    blogs.value = response.blogs as any[]
    total.value = response.total
    totalPages.value = response.totalPages
  }
  catch (error: any) {
    console.error('加载文章失败:', error)
  }
  finally {
    isLoading.value = false
  }
}

// 执行搜索
async function handleSearch() {
  isSearching.value = true
  currentPage.value = 1 // 搜索时重置到第一页
  await loadBlogs()
  hasSearched.value = true // 标记已执行搜索
  isSearching.value = false
}

// 清除搜索
function clearSearch() {
  searchQuery.value = ''
  hasSearched.value = false
  currentPage.value = 1
  loadBlogs()
}

// 监听搜索框变化
watch(searchQuery, (newValue, oldValue) => {
  // 输入变化时，隐藏搜索结果提示
  if (newValue !== oldValue && hasSearched.value) {
    hasSearched.value = false
  }

  // 搜索框清空时，自动加载所有文章
  if (!newValue.trim() && oldValue.trim()) {
    currentPage.value = 1
    loadBlogs()
  }
})

// 跳转到指定页
function goToPage(page: number) {
  if (page < 1 || page > totalPages.value)
    return
  currentPage.value = page
  loadBlogs()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取内容预览
function getContentPreview(content: string) {
  // 移除 Markdown 标记，获取纯文本
  const plainText = content
    .replace(/[#*`>\-[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '')
}

// 查看文章
function handleView(blog: Blog) {
  const username = blog.authorName
  const lowercaseUsername = username.toLowerCase()

  if (lowercaseUsername === 'admin') {
    // admin 用户的博客路径
    window.open(`/${blog.slug}`, '_blank')
  }
  else {
    // 普通用户的博客路径
    window.open(`/${lowercaseUsername}/blog/${blog.slug}`, '_blank')
  }
}

onMounted(() => {
  // 检查是否登录
  if (!authStore.isAuthenticated) {
    router.go('/dash/login')
    return
  }

  loadBlogs()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-2xl font-light text-gray-800">
          探索
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          发现社区中的精彩内容 (共 {{ total }} 篇)
        </p>
      </div>

      <!-- 搜索框 -->
      <div class="mb-6">
        <div class="relative flex items-center gap-2">
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索文章标题..."
              class="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              @keyup.enter="handleSearch"
            >
            <!-- 清除按钮 -->
            <button
              v-if="searchQuery"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              @click="clearSearch"
            >
              <div class="i-material-symbols:close w-5 h-5" />
            </button>
          </div>

          <!-- 搜索按钮 -->
          <button
            :disabled="isSearching || !searchQuery.trim()"
            class="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            @click="handleSearch"
          >
            <div
              v-if="isSearching"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            />
            <div v-else class="i-material-symbols:search w-5 h-5" />
            <span>搜索</span>
          </button>
        </div>

        <!-- 搜索提示 -->
        <div v-if="hasSearched && searchQuery.trim()" class="mt-2 text-sm text-gray-600">
          搜索结果：{{ total }} 篇文章包含 "{{ searchQuery }}"
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="inline-block w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mb-3" />
          <p class="text-gray-600">
            加载中...
          </p>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="blogs.length === 0" class="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div class="i-material-symbols:article-outline w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">
          暂时还没有内容
        </p>
      </div>

      <!-- 文章列表 -->
      <div v-else class="space-y-3">
        <div
          v-for="blog in blogs"
          :key="blog._id"
          class="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors cursor-pointer"
          @click="handleView(blog)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- 标题和作者 -->
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <h3 class="text-lg font-medium text-gray-800">
                  {{ blog.title }}
                </h3>
                <span
                  v-if="blog.pinned"
                  class="bg-blue-100 text-blue-700 px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                >
                  置顶
                </span>
              </div>

              <!-- 作者信息 -->
              <div class="flex items-center gap-2 mb-3">
                <div class="i-material-symbols:person-outline w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-600">
                  {{ blog.authorName }}
                </span>
              </div>

              <!-- 内容预览 -->
              <p class="text-sm text-gray-600 line-clamp-2 mb-3">
                {{ getContentPreview(blog.content) }}
              </p>

              <!-- 时间信息 -->
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                  <div class="i-material-symbols:schedule w-4 h-4" />
                  {{ formatDate(blog.createdAt) }}
                </span>
                <span class="flex items-center gap-1">
                  <div class="i-material-symbols:update w-4 h-4" />
                  更新于 {{ formatDate(blog.updatedAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          :disabled="currentPage === 1"
          class="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          @click="goToPage(currentPage - 1)"
        >
          <div class="i-material-symbols:chevron-left w-5 h-5" />
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in displayPages"
            :key="page"
            :class="[
              page === currentPage
                ? 'bg-gray-800 text-white'
                : 'border border-gray-300 hover:bg-gray-100',
              page === '...' ? 'cursor-default hover:bg-transparent border-0' : '',
            ]"
            class="min-w-10 h-10 rounded-md transition-colors"
            @click="page !== '...' && goToPage(page as number)"
          >
            {{ page }}
          </button>
        </div>

        <button
          :disabled="currentPage === totalPages"
          class="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          @click="goToPage(currentPage + 1)"
        >
          <div class="i-material-symbols:chevron-right w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
