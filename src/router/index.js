import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/generator'
  },
  {
    path: '/generator',
    name: 'Generator',
    component: () => import('@/views/CardGeneratorView.vue')
  },
  {
    path: '/browser',
    name: 'Browser',
    component: () => import('@/views/CardBrowserView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
