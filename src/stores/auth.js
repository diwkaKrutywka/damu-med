import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      const response = await loginApi(credentials)
      const { access_token, user: userData } = response.data

      setToken(access_token)
      user.value = userData

      router.push('/')
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Ошибка авторизации'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // ignore logout errors
    } finally {
      setToken(null)
      user.value = null
      router.push('/login')
    }
  }

  function checkAuth() {
    return isAuthenticated.value
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    setToken
  }
})
