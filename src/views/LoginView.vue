<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})

const showPassword = ref(false)

const handleSubmit = async () => {
  try {
    await authStore.login(form.value)
  } catch (error) {
    // error handled in store
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card card card-glow">
        <div class="login-header">
          <h1 class="login-title" contenteditable="false">
            <span class="text-gradient">Demo Hub</span>
          </h1>
          <p class="login-subtitle" contenteditable="false">{{ t('login.subtitle') }}</p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label" for="username">{{ t('login.loginLabel') }}</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="form-input"
              :placeholder="t('login.loginPlaceholder')"
              required
              autocomplete="username"
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="password">{{ t('login.passwordLabel') }}</label>
            <div class="password-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :placeholder="t('login.passwordPlaceholder')"
                required
                autocomplete="current-password"
              >
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="authStore.error" class="error-message">
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-lg login-btn"
            :disabled="authStore.loading"
          >
            <span v-if="authStore.loading" class="loader"></span>
            <span v-else>{{ t('login.submit') }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  padding: var(--spacing-2xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.login-title {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px var(--accent-cyan-dim);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.password-wrapper {
  position: relative;
}

.password-wrapper .form-input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.password-toggle:hover {
  color: var(--text-secondary);
}

.error-message {
  padding: var(--spacing-md);
  background: var(--status-red-dim);
  border: 1px solid var(--status-red);
  border-radius: var(--radius-md);
  color: var(--status-red);
  font-size: 0.875rem;
  text-align: center;
}

.login-btn {
  width: 100%;
  margin-top: var(--spacing-md);
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
