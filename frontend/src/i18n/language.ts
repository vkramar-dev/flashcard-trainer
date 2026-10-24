export const supportedLanguages = ["en", "ru", "bg", "es", "de", "fr", "pt", "ja", "zh-hans"] as const

export type AppLanguage = (typeof supportedLanguages)[number]

/**
 * Every language the picker shows.
 * `zh-hans` is the app code for simplified Chinese. `label` is the short code on the button.
 */
export const languageOptions = [
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "bg", label: "BG", name: "Български" },
  { code: "es", label: "ES", name: "Español" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "pt", label: "PT", name: "Português" },
  { code: "ja", label: "JA", name: "日本語" },
  { code: "zh-hans", label: "ZH", name: "简体中文" },
] as const

export type LanguageCode = (typeof languageOptions)[number]["code"]

/** Native names. These stay the same in every dictionary. */
export const languageNames: Record<AppLanguage, string> = {
  en: "English",
  ru: "Русский",
  bg: "Български",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  pt: "Português",
  ja: "日本語",
  "zh-hans": "简体中文",
}

const supportedLanguageSet = new Set<string>(supportedLanguages)

export function isLanguageAvailable(code: string): code is AppLanguage {
  return supportedLanguageSet.has(code)
}

export function languageLabel(code: string): string {
  return languageOptions.find((option) => option.code === code)?.label ?? "EN"
}

export const LANGUAGE_STORAGE_KEY = "flashcard-trainer.language"

/** `en-US` becomes `en`. Simplified Chinese tags such as `zh-CN` become `zh-hans`. */
export function normalizeLanguage(value: string | null | undefined): AppLanguage | null {
  if (!value) return null
  const cleaned = value.trim().toLowerCase().replace(/_/g, "-")
  if (supportedLanguageSet.has(cleaned)) return cleaned as AppLanguage
  if (cleaned === "zh" || cleaned === "zh-cn" || cleaned === "zh-sg" || cleaned.startsWith("zh-hans")) {
    return "zh-hans"
  }
  const base = cleaned.split("-")[0]
  return supportedLanguageSet.has(base) ? (base as AppLanguage) : null
}

/** BCP 47 tag for the document element. The app code `zh-hans` is `zh-Hans` there. */
export function documentLanguage(language: AppLanguage): string {
  return language === "zh-hans" ? "zh-Hans" : language
}

export function resolveLanguage(input: {
  query: string | null
  stored: string | null
  browserLanguages: readonly string[]
}): AppLanguage {
  const fromQuery = normalizeLanguage(input.query)
  if (fromQuery) return fromQuery

  const fromStorage = normalizeLanguage(input.stored)
  if (fromStorage) return fromStorage

  for (const candidate of input.browserLanguages) {
    const match = normalizeLanguage(candidate)
    if (match) return match
  }

  return "en"
}
