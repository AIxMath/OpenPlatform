<script setup lang="ts">
import { ref, Transition } from 'vue'
import { RouterView } from 'vue-router'

// 模拟用户的登录状态
const isLoggedIn = ref(true)

// 使用一个响应式变量来管理用户菜单的打开状态
const showUserMenu = ref(false)

// 切换菜单
const toggleUserMenu = () => {
  // 只有在登录状态下才允许切换菜单
  if (isLoggedIn.value) {
    showUserMenu.value = !showUserMenu.value
  }
}

// 关闭菜单
const closeMenus = () => {
  showUserMenu.value = false
}

// 模拟退出登录函数
const logout = () => {
  // 实际项目中应调用退出登录 API，并清空本地存储的 token/session
  console.log('执行退出登录操作...')
  isLoggedIn.value = false // 模拟状态变化
  closeMenus()
}

// 模拟页面跳转函数 (实际应用中会使用 router.push)
const navigateTo = (path: string) => {
    console.log(`跳转到：${path}`)
    // router.push(path) // 在实际项目中启用
    closeMenus()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50" @click="closeMenus">
    <header
      class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
    >
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 cursor-pointer" @click="navigateTo('/')">
            <div class="text-blue-500 text-2xl font-bold font-serif">AI x Math</div>
          </div>

          <nav class="hidden md:flex items-center gap-6 text-sm">
            <a href="#" class="text-gray-700 hover:text-blue-500 transition">关注</a>
            <a href="#" class="text-gray-700 hover:text-blue-500 transition">推荐</a>
            <a href="#" class="text-gray-700 hover:text-blue-500 transition">热榜</a>
            <a href="#" class="text-gray-700 hover:text-blue-500 transition">专栏</a>
          </nav>
        </div>

        <div class="flex-1 max-w-md mx-8 hidden lg:block">
          <div class="relative">
            <input
              type="text"
              placeholder="搜索"
              class="w-full px-4 py-2 pr-10 bg-gray-100 rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 transition"
              @click.stop
              @focus="closeMenus"
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <div class="i-carbon-search text-lg"></div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            class="lg:hidden w-10 h-10 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
          >
            <div class="i-carbon-search text-xl"></div>
          </button>

          <div class="relative flex items-center gap-4">
            <button
              v-if="!isLoggedIn"
              @click="navigateTo('/login')"
              class="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
            >
              登录
            </button>

            <template v-else>
              <button
                @click="navigateTo('/edit/new')"
                class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                title="新建文章"
              >
                <div class="i-carbon-add text-xl"></div>
              </button>

              <div class="relative" @click.stop>
                <button
                  @click="toggleUserMenu"
                  class="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition"
                >
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=UserAvatar"
                    alt="用户头像"
                    class="w-full h-full object-cover"
                  />
                </button>

                <Transition name="dropdown">
                  <div
                    v-if="showUserMenu"
                    class="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                  >
                    <a
                      href="#"
                      @click.prevent="navigateTo('/manage-articles')"
                      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <div class="i-carbon-document-management text-gray-500 text-lg"></div>
                      <span class="text-sm">文章管理</span>
                    </a>
                    <a
                      href="#"
                      @click.prevent="navigateTo('/edit/new')"
                      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <div class="i-carbon-edit text-gray-500 text-lg"></div>
                      <span class="text-sm">新建文章</span>
                    </a>
                    <a
                      href="#"
                      @click.prevent="navigateTo('/settings')"
                      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <div class="i-carbon-settings text-gray-500 text-lg"></div>
                      <span class="text-sm">设置</span>
                    </a>

                    <div class="border-t border-gray-200 my-2"></div>

                    <a
                      href="#"
                      @click.prevent="logout"
                      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-red-500"
                    >
                      <div class="i-carbon-logout text-lg"></div>
                      <span class="text-sm">退出登录</span>
                    </a>
                  </div>
                </Transition>
              </div>
            </template>
          </div>
        </div>
      </div>
    </header>

    <main class="pt-20 px-4">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>