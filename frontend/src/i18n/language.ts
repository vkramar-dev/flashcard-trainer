export const supportedLanguages = ["en", "ru"] as const

export type AppLanguage = (typeof supportedLanguages)[number]

/** Native names. These stay the same in every dictionary. */
export const languageNames: Record<AppLanguage, string> = {
  en: "English",
  ru: "Русский",
}

/**
 * Every language the picker shows. Only entries in `supportedLanguages`
 * can be selected; the rest stay visible until their dictionaries exist.
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

export function isLanguageAvailable(code: string): code is AppLanguage {
  return (supportedLanguages as readonly string[]).includes(code)
}

export function languageLabel(code: string): string {
  return languageOptions.find((option) => option.code === code)?.label ?? "EN"
}

export const LANGUAGE_STORAGE_KEY = "flashcard-trainer.language"

/** `en-US` and `ru-RU` become `en` and `ru`. Anything else is unsupported. */
export function normalizeLanguage(value: string | null | undefined): AppLanguage | null {
  if (!value) return null
  const base = value.trim().toLowerCase().split(/[-_]/)[0]
  return (supportedLanguages as readonly string[]).includes(base) ? (base as AppLanguage) : null
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
