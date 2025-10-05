<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import AuthorInfo from './components/AuthorInfo.vue'
import NavBar from './components/NavBar.vue'
import ReadingStats from './components/ReadingStats.vue'

const { Layout } = DefaultTheme
const { page, frontmatter } = useData()

// 判断是否是博客文章页面（不是首页、dash页面等）
const isBlogPost = computed(() => {
  const path = page.value.relativePath
  // 排除特殊页面
  if (path === 'index.md' || path.startsWith('dash/')) {
    return false
  }
  // 博客文章通常在用户目录下或根目录的.md文件
  return path.endsWith('.md') && !frontmatter.value.layout
})
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <ClientOnly>
        <NavBar />
      </ClientOnly>
    </template>

    <!-- 阅读统计 - 显示在文章内容之前 -->
    <template #doc-before>
      <ClientOnly>
        <ReadingStats v-if="isBlogPost" />
      </ClientOnly>
    </template>

    <!-- 作者信息 - 显示在文章内容之后 -->
    <template #doc-after>
      <ClientOnly>
        <AuthorInfo v-if="isBlogPost" />
      </ClientOnly>
    </template>
  </Layout>
</template>

<style scoped>
</style>
