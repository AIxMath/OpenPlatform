<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
// const { default: Comp } = await import(`./pages/${__pageData.params.page}.vue`)
// const x = await import(`./pages/${__pageData.params.page}.vue`)
const AsyncComp = defineAsyncComponent(async () => {
  const { default: Comp } = await import(`./pages/${__pageData.params.page}.vue`)
  return Comp
})
</script>

<AsyncComp />