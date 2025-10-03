<script setup lang="ts">
import type { Highlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'
import * as monaco from 'monaco-editor-core'
import { createHighlighter } from 'shiki'
import { onMounted, onUnmounted, ref, watch } from 'vue'

// Model bound content (markdown text) ensure default empty string
const content = defineModel<string>({
  type: String,
  default: '',
})

// Monaco editor instance ref
const editorInstance = ref<monaco.editor.IStandaloneCodeEditor | null>(null)
// Shiki highlighter instance ref
const highlighterInstance = ref<Highlighter | null>(null)

// 暴露插入文本的方法
function insertText(text: string, moveCursor = 0): void {
  const editor = editorInstance.value
  if (!editor)
    return

  const selection = editor.getSelection() ?? new monaco.Selection(1, 1, 1, 1)
  const position = selection.getStartPosition()

  // 计算插入文本后的新位置
  const lines = text.split('\n')
  let newLineNumber = position.lineNumber
  let newColumn = position.column

  if (lines.length === 1) {
    // 单行插入
    newColumn = position.column + text.length + moveCursor
  }
  else {
    // 多行插入
    newLineNumber = position.lineNumber + lines.length - 1
    newColumn = lines[lines.length - 1].length + 1 + moveCursor
  }

  editor.executeEdits('', [{
    range: new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    ),
    text,
  }])

  // 设置光标位置
  const newPosition = new monaco.Position(newLineNumber, newColumn)
  editor.setPosition(newPosition)
  editor.revealPositionInCenter(newPosition)

  // 确保编辑器获得焦点
  setTimeout(() => {
    editor.focus()
  }, 0)
}

// 暴露获取选中文本的方法
function getSelectedText(): string {
  const editor = editorInstance.value
  if (!editor)
    return ''
  const selection = editor.getSelection()
  if (!selection)
    return ''
  const model = editor.getModel()
  if (!model)
    return ''
  return model.getValueInRange(selection)
}

// 暴露替换选中文本的方法
function replaceSelectedText(text: string): void {
  const editor = editorInstance.value
  if (!editor)
    return

  const selection = editor.getSelection()
  if (!selection) {
    // Insert at current cursor if no selection
    const pos = editor.getPosition() ?? new monaco.Position(1, 1)
    editor.executeEdits('', [{
      range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
      text,
    }])
  }
  else {
    editor.executeEdits('', [{
      range: selection,
      text,
    }])
  }

  // 确保编辑器获得焦点
  setTimeout(() => {
    editor.focus()
  }, 0)
}

defineExpose({
  insertText,
  getSelectedText,
  replaceSelectedText,
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

  const container = document.getElementById('container') as HTMLElement | null
  if (!container)
    return

  const editor = monaco.editor.create(container, {
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
    if (typeof newContent === 'string' && newContent !== editor.getValue())
      editor.setValue(newContent)
  })
})

onUnmounted(() => {
  editorInstance.value?.dispose()
  highlighterInstance.value?.dispose()
})
</script>

<template>
  <div id="container" />
</template>
