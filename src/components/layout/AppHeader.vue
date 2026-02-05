<script setup>
import { useRoute } from 'vue-router'
import { useLanguage } from '@/composables/useLanguage'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const { language, setLanguage } = useLanguage()
const { show } = useNotification()
const authStore = useAuthStore()

const navLinks = [
  { path: '/', name: 'Стенды' },
  { path: '/analytics', name: 'Аналитика' }
]

const isActive = (path) => {
  return route.path === path
}

const switchLanguage = (lang) => {
  setLanguage(lang)
}

const resetDemoData = () => {
  localStorage.removeItem('demoAnalyticsData')
  localStorage.removeItem('demoCallHistory')
  localStorage.removeItem('demoPatients')
  show('Данные демо сброшены', 'success')
}

const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <header class="header">
    <div class="container header-content">
      <router-link to="/" class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span>Demo <span class="text-gradient">Hub</span></span>
      </router-link>

      <nav class="nav">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="nav-link"
          :class="{ active: isActive(link.path) }"
        >
          {{ link.name }}
        </router-link>

        <div class="lang-switcher">
          <button
            class="lang-btn"
            :class="{ active: language === 'kz' }"
            @click="switchLanguage('kz')"
          >
            KZ
          </button>
          <button
            class="lang-btn"
            :class="{ active: language === 'ru' }"
            @click="switchLanguage('ru')"
          >
            RU
          </button>
        </div>

        <button class="btn btn-outline btn-sm" @click="resetDemoData">
          Сбросить данные
        </button>

        <button class="btn btn-ghost btn-sm logout-btn" @click="handleLogout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Выйти
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.logo-icon svg {
  width: 24px;
  height: 24px;
  stroke: var(--bg-primary);
}
</style>
