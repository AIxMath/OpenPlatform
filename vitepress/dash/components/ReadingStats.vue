<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, onMounted, ref } from 'vue'

const { page } = useData()

const wordCount = ref(0)
const readingTime = ref(0)

// 计算中文字数（包括中文字符、英文单词、数字）
function countWords(text: string): number {
  // 移除代码块
  text = text.replace(/```[\s\S]*?```/g, '')
  // 移除行内代码
  text = text.replace(/`[^`]*`/g, '')
  // 移除HTML标签
  text = text.replace(/<[^>]*>/g, '')
  // 移除Markdown语法
  text = text.replace(/[#*_~`>\-[\]()]/g, '')

  // 统计中文字符
  const chineseChars = text.match(/[\u4E00-\u9FA5]/g) || []
  // 统计英文单词（连续的字母、数字）
  const words = text.match(/[a-z0-9]+/gi) || []

  return chineseChars.length + words.length
}

// 计算阅读时间（分钟）
function calculateReadingTime(words: number): number {
  // 假设中文阅读速度：300字/分钟
  // 英文阅读速度：200词/分钟
  // 这里简化为平均 250 字/分钟
  const minutes = Math.ceil(words / 250)
  return Math.max(1, minutes) // 至少1分钟
}

const stats = computed(() => {
  const words = wordCount.value
  const time = readingTime.value
  return {
    words: words.toLocaleString(),
    time,
    timeText: time === 1 ? '1 分钟' : `${time} 分钟`,
  }
})

onMounted(() => {
  // 从 DOM 中获取渲染后的文章内容
  // VitePress 会将文章内容渲染到 .vp-doc 容器中
  const docElement = document.querySelector('.vp-doc')
  if (docElement) {
    const content = docElement.textContent || ''
    const words = countWords(content)
    wordCount.value = words
    readingTime.value = calculateReadingTime(words)
  }
})
</script>

<template>
  <div v-if="wordCount > 0" class="reading-stats">
    <span class="stat-item">
      <span class="icon">📖</span>
      <span class="text">{{ stats.words }} 字</span>
    </span>
    <span class="separator">·</span>
    <span class="stat-item">
      <span class="icon">⏱️</span>
      <span class="text">约 {{ stats.timeText }} 阅读</span>
    </span>
  </div>
</template>

<style scoped>
.reading-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.icon {
  font-size: 1rem;
}

.separator {
  color: #d1d5db;
}

@media (max-width: 768px) {
  .reading-stats {
    font-size: 0.8125rem;
    padding: 0.625rem 0.875rem;
  }
}
</style>
