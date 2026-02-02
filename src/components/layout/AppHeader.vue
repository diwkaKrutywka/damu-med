<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguage } from '@/composables/useLanguage'
import { useNotification } from '@/composables/useNotification'

const route = useRoute()
const { language, setLanguage } = useLanguage()
const { show } = useNotification()

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
