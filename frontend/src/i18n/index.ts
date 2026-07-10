import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'

const STORAGE_KEY = 'veritas-locale'

const savedLocale = typeof window !== 'undefined'
  ? localStorage.getItem(STORAGE_KEY) ?? 'en'
  : 'en'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: savedLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

if (typeof window !== 'undefined') {
  document.documentElement.lang = savedLocale
}

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lng)
    document.documentElement.lang = lng
  }
})

export default i18n
