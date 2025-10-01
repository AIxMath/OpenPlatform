<template>
  <div id="container"></div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted } from 'vue'
import { shikiToMonaco } from '@shikijs/monaco'
import * as monaco from 'monaco-editor-core'
import { createHighlighter } from 'shiki'

const content = defineModel()
const editorInstance = ref(null)
const highlighterInstance = ref(null)

// 暴露插入文本的方法
const insertText = (text, moveCursor = 0) => {
  if (!editorInstance.value) return
  
  const editor = editorInstance.value
  const selection = editor.getSelection()
  const position = selection.getStartPosition()
  
  // 计算插入文本后的新位置
  const lines = text.split('\n')
  let newLineNumber = position.lineNumber
  let newColumn = position.column
  
  if (lines.length === 1) {
    // 单行插入
    newColumn = position.column + text.length + moveCursor
  } else {
    // 多行插入
    newLineNumber = position.lineNumber + lines.length - 1
    newColumn = lines[lines.length - 1].length + 1 + moveCursor
  }
  
  editor.executeEdits('', [{
    range: new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column
    ),
    text: text
  }])
  
  // 设置光标位置
  const newPosition = new monaco.Position(newLineNumber, newColumn)
  // editor.setPosition(newPosition)
  // editor.revealPositionInCenter(newPosition)
  
  // 确保编辑器获得焦点
  setTimeout(() => {
    editor.focus()
  }, 0)
}

// 暴露获取选中文本的方法
const getSelectedText = () => {
  if (!editorInstance.value) return ''
  const selection = editorInstance.value.getSelection()
  return editorInstance.value.getModel().getValueInRange(selection)
}

// 暴露替换选中文本的方法
const replaceSelectedText = (text) => {
  if (!editorInstance.value) return
  
  const editor = editorInstance.value
  const selection = editor.getSelection()
  
  editor.executeEdits('', [{
    range: selection,
    text: text
  }])
  
  // 确保编辑器获得焦点
  setTimeout(() => {
    editor.focus()
  }, 0)
}

defineExpose({
  insertText,
  getSelectedText,
  replaceSelectedText
})

onMounted(async () => {
  // Create the highlighter, it can be reused
  highlighterInstance.value = await createHighlighter({
    themes: [
      // 'vitesse-dark',
      'vitesse-light',
    ],
    langs: [
      'markdown',
    ],
  })

  monaco.languages.register({ id: 'markdown' })

  shikiToMonaco(highlighterInstance.value, monaco)

  const editor = monaco.editor.create(document.getElementById('container'), {
    value: content.value,
    language: 'markdown',
    theme: 'vitesse-light',
    fontSize: 14,
    lineHeight: 24,
    padding: { top: 16, bottom: 16 },
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
  })

  editorInstance.value = editor

  editor.onDidChangeModelContent(() => {
    content.value = editor.getValue()
  })
  
  watch(content, (newContent) => {
    if (newContent !== editor.getValue()) {
      editor.setValue(newContent)
    }
  })
})

onUnmounted(() => {
  editorInstance.value.dispose()
  highlighterInstance.value.dispose()
})

</script>
