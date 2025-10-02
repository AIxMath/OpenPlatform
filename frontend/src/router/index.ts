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
    {
      name: 'login',
      path: '/login',
      component: () => import('../pages/login.vue'),
    },
    {
      name: 'register',
      path: '/register',
      component: () => import('../pages/register.vue'),
    },
  ],
})

export default router
