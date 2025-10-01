import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      name: 'home',
      path: '/',
      component: () => import('../pages/home.vue'),
    },
    {
      name: 'edit',
      path: '/edit/:id',
      component: () => import('../pages/edit.vue'),
    },
  ],
})

export default router
