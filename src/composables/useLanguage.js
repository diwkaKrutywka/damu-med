import { ref, readonly } from 'vue'

const language = ref(localStorage.getItem('language') || 'ru')

export function useLanguage() {
  const setLanguage = (lang) => {
    language.value = lang
    localStorage.setItem('language', lang)
  }

  return {
    language: readonly(language),
    setLanguage
  }
}
