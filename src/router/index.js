import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/voice-robot',
    name: 'voice-robot',
    component: () => import('@/views/VoiceRobotView.vue')
  },
  {
    path: '/whatsapp',
    name: 'whatsapp',
    component: () => import('@/views/WhatsAppView.vue')
  },
  {
    path: '/terminal',
    name: 'terminal',
    component: () => import('@/views/TerminalView.vue')
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/views/AnalyticsView.vue')
  },
  {
    path: '/script-robot',
    name: 'script-robot',
    component: () => import('@/views/ScriptRobotView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
