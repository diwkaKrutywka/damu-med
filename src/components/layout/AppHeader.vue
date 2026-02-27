<script setup>
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLanguage } from '@/composables/useLanguage'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const { t } = useI18n()
const { language, setLanguage } = useLanguage()
const { show } = useNotification()
const authStore = useAuthStore()

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
  show(t('common.resetDemoData'), 'success')
}

const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <header class="header">
    <div class="container header-content" style="user-select: none;">
      <router-link to="/" class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span contenteditable="false">Demo <span class="text-gradient">Hub</span></span>
      </router-link>

      <nav class="nav">
        <router-link to="/" class="nav-link" :class="{ active: isActive('/') }">
          {{ t('nav.stands') }}
        </router-link>
        <router-link to="/analytics" class="nav-link" :class="{ active: isActive('/analytics') }">
          {{ t('nav.analytics') }}
        </router-link>

        <div class="lang-switcher">
          <button
            class="lang-btn"
            :class="{ active: language === 'kk' }"
            @click="switchLanguage('kk')"
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
          {{ t('nav.resetData') }}
        </button>

        <button class="btn btn-ghost btn-sm logout-btn" @click="handleLogout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {{ t('nav.logout') }}
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
