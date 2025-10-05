<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  src?: string | null
  username: string
  size?: 'small' | 'medium' | 'large'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  size: 'medium',
  clickable: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-10 h-10 text-lg'
    case 'medium':
      return 'w-16 h-16 text-2xl'
    case 'large':
      return 'w-24 h-24 text-4xl'
    default:
      return 'w-16 h-16 text-2xl'
  }
})

const firstLetter = computed(() => {
  return props.username.charAt(0).toUpperCase()
})

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <div
    class="avatar-container" :class="[
      sizeClasses,
      { 'cursor-pointer hover:opacity-80': clickable },
    ]"
    @click="handleClick"
  >
    <!-- 如果有头像图片，显示图片 -->
    <img
      v-if="src"
      :src="src"
      :alt="username"
      class="avatar-image"
    >
    <!-- 否则显示首字母 -->
    <div v-else class="avatar-letter">
      {{ firstLetter }}
    </div>
  </div>
</template>

<style scoped>
.avatar-container {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
}

.avatar-letter {
  width: 100%;
  height: 100%;
  background: #1f2937;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
}
</style>
