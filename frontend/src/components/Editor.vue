<template>
  <div id="container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { shikiToMonaco } from '@shikijs/monaco'
import * as monaco from 'monaco-editor-core'
import { createHighlighter } from 'shiki'

const content = defineModel()

onMounted(async () => {
  // Create the highlighter, it can be reused
  const highlighter = await createHighlighter({
    themes: [
      // 'vitesse-dark',
      'vitesse-light',
    ],
    langs: [
      'markdown',
    ],
  })

  monaco.languages.register({ id: 'markdown' })

  shikiToMonaco(highlighter, monaco)

  const editor = monaco.editor.create(document.getElementById('container'), {
    value: content.value,
    language: 'markdown',
    theme: 'vitesse-light',
  })

  editor.onDidChangeModelContent(() => {
    content.value = editor.getValue()
  })
  
  watch(content, (newContent) => {
    if (newContent !== editor.getValue()) {
      editor.setValue(newContent)
    }
  })

  onUnmounted(() => {
    editor.dispose()
    highlighter.dispose()
  })
})
</script>
