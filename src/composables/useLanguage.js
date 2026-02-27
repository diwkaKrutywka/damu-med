import { ref, readonly } from 'vue'
import { i18n } from '@/i18n'

const language = ref(localStorage.getItem('language') || 'ru')

export function useLanguage() {
  const setLanguage = (lang) => {
    language.value = lang
    localStorage.setItem('language', lang)
    i18n.global.locale.value = lang
  }

  return {
    language: readonly(language),
    setLanguage
  }
}
