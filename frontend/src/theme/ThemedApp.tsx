import { CssBaseline, ThemeProvider } from "@mui/material"
import { enUS, ruRU } from "@mui/material/locale"
import { createTheme } from "@mui/material/styles"
import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "../store/hooks"
import { getTheme } from "./index"

/** Applies the color scheme held in settingsSlice to the whole application. */
export function ThemedApp({ children }: { children: ReactNode }) {
  const colorScheme = useAppSelector((state) => state.settings.colorScheme)
  const { i18n } = useTranslation()
  const theme = useMemo(
    () => createTheme(getTheme(colorScheme), i18n.resolvedLanguage === "ru" ? ruRU : enUS),
    [colorScheme, i18n.resolvedLanguage],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
