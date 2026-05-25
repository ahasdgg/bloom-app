import { useAppStore } from '../store'
import { translations } from './translations'

export function useTranslation() {
  const store = useAppStore()
  const language = store.language

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key
  }

  return { t, language }
}
