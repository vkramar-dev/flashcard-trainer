import { CssBaseline, ThemeProvider } from "@mui/material"
import { useMemo, type ReactNode } from "react"
import { useAppSelector } from "../store/hooks"
import { getTheme } from "./index"

/** Applies the color scheme held in settingsSlice to the whole application. */
export function ThemedApp({ children }: { children: ReactNode }) {
  const colorScheme = useAppSelector((state) => state.settings.colorScheme)
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
