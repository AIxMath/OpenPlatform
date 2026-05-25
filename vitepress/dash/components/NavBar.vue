<script setup lang="ts">
import { useRoute } from 'vitepress'
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import CreateBlogDialog from './CreateBlogDialog.vue'

const authStore = useAuthStore()
const route = useRoute()

const showCreateDialog = ref(false)

function isActive(path: string) {
  return route.path === path
}

function handleCreateBlog() {
  showCreateDialog.value = true
}
</script>

<template>
  <div class="nav-bar-container">
    <!-- 导航链接 -->
    <div class="nav-links">
      <a
        href="/dash/explore"
        class="nav-link"
        :class="{ active: isActive('/dash/explore') }"
      >
        <div class="i-material-symbols:explore-outline w-4.5 h-4.5" />
        <span>探索</span>
      </a>

      <a
        v-if="authStore.isAdmin"
        href="/dash/my-blogs"
        class="nav-link"
        :class="{ active: isActive('/dash/my-blogs') }"
      >
        <div class="i-material-symbols:article-outline w-4.5 h-4.5" />
        <span>内容管理</span>
      </a>

      <button
        v-if="authStore.isAdmin && !isActive('/dash/edit')"
        class="nav-link nav-link-primary"
        @click="handleCreateBlog"
      >
        <div class="i-material-symbols:edit-outline w-4.5 h-4.5" />
        <span>写文章</span>
      </button>
    </div>

    <!-- 用户按钮 -->
    <div v-if="authStore.isAdmin" class="user-section">
      <!-- 已登录状态 -->
      <div class="user-menu">
        <a
          href="/dash/user"
          class="user-button"
          :class="{ active: isActive('/dash/user') }"
        >
          <div class="i-material-symbols:person-outline w-5 h-5" />
          <span>{{ authStore.user.username }}</span>
        </a>
      </div>
    </div>

    <!-- 创建博客对话框 -->
    <CreateBlogDialog v-if="authStore.isAdmin" v-model:show="showCreateDialog" />
  </div>
</template>

<style scoped>
.nav-bar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1.5rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  border-radius: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover {
  color: #1f2937;
  background-color: #f3f4f6;
}

.nav-link.active {
  color: #1f2937;
  background-color: #e5e7eb;
}

.nav-link-primary {
  color: #1f2937;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
}

.nav-link-primary:hover {
  background-color: #1f2937;
  color: white;
  border-color: #1f2937;
}

.nav-link-primary.active {
  background-color: #1f2937;
  color: white;
  border-color: #1f2937;
}

.user-section {
  margin-left: 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid #e5e7eb;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  border-radius: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
  border: 1px solid #d1d5db;
}

.user-button:hover {
  color: #1f2937;
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.user-button.active {
  color: #1f2937;
  background-color: #e5e7eb;
  border-color: #6b7280;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-button,
.register-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
}

.login-button {
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.login-button:hover {
  color: #1f2937;
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.register-button {
  color: white;
  background-color: #1f2937;
  border: 1px solid #1f2937;
}

.register-button:hover {
  background-color: #111827;
  border-color: #111827;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-bar-container {
    flex-wrap: wrap;
    margin-left: 0.5rem;
    gap: 0.5rem;
  }

  .nav-links {
    gap: 0.25rem;
  }

  .nav-link span,
  .user-button span {
    display: none;
  }

  .user-section {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
  }
}
</style>
