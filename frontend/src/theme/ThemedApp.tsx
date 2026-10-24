import { CssBaseline, ThemeProvider } from "@mui/material"
import { bgBG, deDE, enUS, esES, frFR, jaJP, ptPT, ruRU, zhCN } from "@mui/material/locale"
import { createTheme } from "@mui/material/styles"
import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { normalizeLanguage, type AppLanguage } from "../i18n/language"
import { useAppSelector } from "../store/hooks"
import { getTheme } from "./index"

const muiLocales: Record<AppLanguage, typeof enUS> = {
  en: enUS,
  ru: ruRU,
  bg: bgBG,
  es: esES,
  de: deDE,
  fr: frFR,
  pt: ptPT,
  ja: jaJP,
  "zh-hans": zhCN,
}

/** Applies the color scheme held in settingsSlice to the whole application. */
export function ThemedApp({ children }: { children: ReactNode }) {
  const colorScheme = useAppSelector((state) => state.settings.colorScheme)
  const { i18n } = useTranslation()
  const language = normalizeLanguage(i18n.resolvedLanguage) ?? "en"
  const theme = useMemo(
    () => createTheme(getTheme(colorScheme), muiLocales[language]),
    [colorScheme, language],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
