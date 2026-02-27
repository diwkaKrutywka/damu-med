import { createI18n } from 'vue-i18n'
import ru from './locales/ru.json'
import kk from './locales/kk.json'

const savedLang = localStorage.getItem('language') || 'ru'

export const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'ru',
  messages: { ru, kk }
})

export default i18n
