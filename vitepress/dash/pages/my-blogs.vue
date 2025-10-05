<script setup lang="ts">
import { useRouter } from 'vitepress/client'
import { computed, onMounted, ref } from 'vue'
import CreateBlogDialog from '../components/CreateBlogDialog.vue'
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

// 创建文章对话框
const showCreateDialog = ref(false)

// 删除文章对话框
const showDeleteDialog = ref(false)
const isDeleting = ref(false)
const blogToDelete = ref<Blog | null>(null)

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
    const response = await trpc.getMyBlogs.query({
      page: currentPage.value,
      limit: pageSize,
    })

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
  return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '')
}

// 编辑文章
function handleEdit(blog: Blog) {
  router.go(`/dash/edit?slug=${blog.slug}`)
}

// 查看文章
function handleView(blog: Blog) {
  const username = authStore.user?.username || blog.authorName
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

// 切换可见性
async function handleToggleVisibility(blog: Blog) {
  try {
    await trpc.toggleBlogVisibility.mutate({
      blogId: blog._id,
    })

    // 更新本地数据
    const index = blogs.value.findIndex(b => b._id === blog._id)
    if (index !== -1) {
      blogs.value[index].visibility = blog.visibility === 'public' ? 'private' : 'public'
    }
  }
  catch (error: any) {
    console.error('切换可见性失败:', error)
    alert(error.message || '操作失败，请稍后重试')
  }
}

// 确认删除
function confirmDelete(blog: Blog) {
  blogToDelete.value = blog
  showDeleteDialog.value = true
}

// 删除文章
async function handleDelete() {
  if (!blogToDelete.value)
    return

  isDeleting.value = true

  try {
    await trpc.deleteBlog.mutate({
      blogId: blogToDelete.value._id,
    })

    showDeleteDialog.value = false
    blogToDelete.value = null

    // 如果当前页只有一条数据且不是第一页，跳转到上一页
    if (blogs.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }

    // 重新加载列表
    await loadBlogs()
  }
  catch (error: any) {
    console.error('删除文章失败:', error)
    alert(error.message || '删除失败，请稍后重试')
  }
  finally {
    isDeleting.value = false
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
      <!-- 页面标题和操作栏 -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-light text-gray-800">
            我的文章
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            共 {{ total }} 篇文章
          </p>
        </div>
        <button
          class="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-md font-medium hover:bg-gray-800 hover:text-white transition-all flex items-center gap-2"
          @click="showCreateDialog = true"
        >
          <div class="i-material-symbols:add w-5 h-5" />
          <span>新建文章</span>
        </button>
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
        <p class="text-gray-500 mb-4">
          还没有文章
        </p>
        <button
          class="px-4 py-2 border-2 border-gray-800 text-gray-800 rounded-md font-medium hover:bg-gray-800 hover:text-white transition-all inline-flex items-center gap-2"
          @click="showCreateDialog = true"
        >
          <div class="i-material-symbols:add w-5 h-5" />
          <span>创建第一篇文章</span>
        </button>
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
              <!-- 标题和状态 -->
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-lg font-medium text-gray-800 truncate">
                  {{ blog.title }}
                </h3>
                <span
                  :class="blog.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                  class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                >
                  {{ blog.visibility === 'public' ? '公开' : '私密' }}
                </span>
                <span
                  v-if="blog.pinned"
                  class="bg-blue-100 text-blue-700 px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                >
                  置顶
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
                  创建于 {{ formatDate(blog.createdAt) }}
                </span>
                <span class="flex items-center gap-1">
                  <div class="i-material-symbols:update w-4 h-4" />
                  更新于 {{ formatDate(blog.updatedAt) }}
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center gap-2 flex-shrink-0" @click.stop>
              <button
                class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title="编辑"
                @click="handleEdit(blog)"
              >
                <div class="i-material-symbols:edit-outline w-5 h-5" />
              </button>
              <button
                class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                :title="blog.visibility === 'public' ? '设为私密' : '设为公开'"
                @click="handleToggleVisibility(blog)"
              >
                <div
                  :class="blog.visibility === 'public' ? 'i-material-symbols:lock-open-outline' : 'i-material-symbols:lock-outline'"
                  class="w-5 h-5"
                />
              </button>
              <button
                class="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                title="删除"
                @click="confirmDelete(blog)"
              >
                <div class="i-material-symbols:delete-outline w-5 h-5" />
              </button>
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

    <!-- 创建文章对话框 -->
    <CreateBlogDialog v-model:show="showCreateDialog" />

    <!-- 删除确认对话框 -->
    <div
      v-if="showDeleteDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
      @click.self="showDeleteDialog = false"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-medium text-gray-800 mb-4">
          确认删除
        </h2>
        <p class="text-gray-600 mb-6">
          确定要删除文章 <span class="font-medium">"{{ blogToDelete?.title }}"</span> 吗？此操作无法撤销。
        </p>

        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            :disabled="isDeleting"
            @click="showDeleteDialog = false"
          >
            取消
          </button>
          <button
            :disabled="isDeleting"
            class="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="handleDelete"
          >
            <div v-if="isDeleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{{ isDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
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
