import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en/translation.json'
import ja from '../locales/ja/translation.json'
import ko from '../locales/ko/translation.json'
import vi from '../locales/vi/translation.json'
import zh from '../locales/zh/translation.json'

export const languageStorageKey = 'vii.lang'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi', 'zh', 'ja', 'ko'],
    interpolation: { escapeValue: false },
    resources: {
      en: { translation: en },
      vi: { translation: vi },
      zh: { translation: zh },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: languageStorageKey,
    },
  })

export default i18n
