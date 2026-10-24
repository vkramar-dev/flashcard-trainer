import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import bg from "../locales/bg.json"
import de from "../locales/de.json"
import en from "../locales/en.json"
import es from "../locales/es.json"
import fr from "../locales/fr.json"
import ja from "../locales/ja.json"
import pt from "../locales/pt.json"
import ru from "../locales/ru.json"
import zhHans from "../locales/zh-hans.json"
import {
  LANGUAGE_STORAGE_KEY,
  type AppLanguage,
  documentLanguage,
  normalizeLanguage,
  resolveLanguage,
  supportedLanguages,
} from "./language"

const initialLanguage = resolveLanguage({
  query: new URLSearchParams(window.location.search).get("lang"),
  stored: window.localStorage.getItem(LANGUAGE_STORAGE_KEY),
  browserLanguages: window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language],
})

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    bg: { translation: bg },
    es: { translation: es },
    de: { translation: de },
    fr: { translation: fr },
    pt: { translation: pt },
    ja: { translation: ja },
    "zh-hans": { translation: zhHans },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: [...supportedLanguages],
  load: "currentOnly",
  lowerCaseLng: true,
  interpolation: { escapeValue: false },
  returnNull: false,
})

function rememberLanguage(language: AppLanguage) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  document.documentElement.lang = documentLanguage(language)
}

rememberLanguage(initialLanguage)

i18n.on("languageChanged", (language) => {
  const normalized = normalizeLanguage(language)
  if (normalized) rememberLanguage(normalized)
})

/** Applies an explicit choice and keeps `?lang=` in step when the page was opened with it. */
export function selectLanguage(language: AppLanguage) {
  const url = new URL(window.location.href)
  if (url.searchParams.has("lang")) {
    url.searchParams.set("lang", language)
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
  }
  void i18n.changeLanguage(language)
}

/** Translates a stored key. Text that is not a key, such as a server message, is returned as-is. */
export function text(value: string | null | undefined, options?: Record<string, unknown>): string {
  if (!value) return ""
  return i18n.exists(value, options) ? i18n.t(value, options) : value
}

export default i18n
