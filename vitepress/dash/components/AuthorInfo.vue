<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import UserAvatar from './UserAvatar.vue'

const { frontmatter } = useData()

// 从 frontmatter 获取作者信息，如果没有则使用默认值
const author = computed(() => ({
  name: frontmatter.value.author || '未知作者',
  avatar: frontmatter.value.avatar || null,
  bio: frontmatter.value.bio || '这个人很懒，什么都没有留下...',
  email: frontmatter.value.email,
  github: frontmatter.value.github,
}))

const hasLinks = computed(() => {
  return author.value.email || author.value.github
})
</script>

<template>
  <div class="author-info">
    <div class="author-label">
      关于作者
    </div>
    <div class="author-content">
      <UserAvatar
        :src="author.avatar"
        :username="author.name"
        size="small"
      />
      <div class="author-details">
        <div class="author-name">
          {{ author.name }}
        </div>
        <div class="author-bio">
          {{ author.bio }}
        </div>
        <div v-if="hasLinks" class="author-links">
          <a v-if="author.email" :href="`mailto:${author.email}`" class="author-link" title="Email">
            <div class="i-material-symbols:mail-outline w-4 h-4" />
            <span>邮箱</span>
          </a>
          <a v-if="author.github" :href="`https://github.com/${author.github}`" target="_blank" rel="noopener noreferrer" class="author-link" title="GitHub">
            <div class="i-material-symbols:code w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.author-info {
  margin: 3rem 0 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.author-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.author-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.author-details {
  flex: 1;
  min-width: 0;
}

.author-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.author-bio {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.author-links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.author-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  color: #6b7280;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: all 0.2s;
}

.author-link:hover {
  color: #1f2937;
  border-color: #d1d5db;
  background: #fafafa;
}

@media (max-width: 768px) {
  .author-info {
    padding: 0.875rem;
  }

  .author-content {
    gap: 0.75rem;
  }

  .author-name {
    font-size: 0.875rem;
  }

  .author-bio {
    font-size: 0.75rem;
  }

  .author-link {
    font-size: 0.75rem;
    padding: 0.3125rem 0.625rem;
  }
}
</style>
