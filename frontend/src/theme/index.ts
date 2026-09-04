import { createTheme, type Theme, type ThemeOptions } from "@mui/material/styles"
import type { ColorSchemeName } from "../types"

export const colorSchemeLabels: Record<ColorSchemeName, string> = {
  default: "Default",
  blue: "Blue",
  green: "Green",
  purple: "Purple",
  dark: "Dark",
}

interface SchemeDefinition {
  mode: "light" | "dark"
  primary: string
  secondary: string
  background: string
  paper: string
  /** Used for the subtle page backdrop behind tiles. */
  backdrop: string
}

export const colorSchemes: Record<ColorSchemeName, SchemeDefinition> = {
  default: {
    mode: "light",
    primary: "#1f6f5c",
    secondary: "#c2703d",
    background: "#f6f5f2",
    paper: "#ffffff",
    backdrop: "#eceae4",
  },
  blue: {
    mode: "light",
    primary: "#1d4ed8",
    secondary: "#0e7490",
    background: "#f4f7fd",
    paper: "#ffffff",
    backdrop: "#e5ecfa",
  },
  green: {
    mode: "light",
    primary: "#15803d",
    secondary: "#4d7c0f",
    background: "#f4f9f4",
    paper: "#ffffff",
    backdrop: "#e4f0e6",
  },
  purple: {
    mode: "light",
    primary: "#6d28d9",
    secondary: "#be185d",
    background: "#f8f5fd",
    paper: "#ffffff",
    backdrop: "#ece3fb",
  },
  dark: {
    mode: "dark",
    primary: "#7dd3a8",
    secondary: "#f0a570",
    background: "#14171c",
    paper: "#1d2127",
    backdrop: "#22272e",
  },
}

const headingFont = '"Space Grotesk", "Segoe UI", system-ui, sans-serif'
const bodyFont = '"Inter", "Segoe UI", system-ui, sans-serif'

function buildOptions(scheme: SchemeDefinition): ThemeOptions {
  const isDark = scheme.mode === "dark"

  return {
    palette: {
      mode: scheme.mode,
      primary: { main: scheme.primary },
      secondary: { main: scheme.secondary },
      // Yellow is too light for white text, so it carries dark text instead.
      warning: { main: "#eab308", contrastText: "#1f2933" },
      background: { default: scheme.background, paper: scheme.paper },
      divider: isDark ? "rgba(255,255,255,0.12)" : "rgba(31,41,51,0.12)",
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 700 },
      h2: { fontFamily: headingFont, fontWeight: 700 },
      h3: { fontFamily: headingFont, fontWeight: 600 },
      h4: { fontFamily: headingFont, fontWeight: 600 },
      h5: { fontFamily: headingFont, fontWeight: 600 },
      h6: { fontFamily: headingFont, fontWeight: 600 },
      subtitle1: { fontFamily: headingFont, fontWeight: 500 },
      button: { fontFamily: headingFont, fontWeight: 600, textTransform: "none" },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.6 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: scheme.background },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "inherit" },
        styleOverrides: {
          root: {
            backgroundColor: scheme.paper,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(31,41,51,0.1)"}`,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(31,41,51,0.1)"}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 20 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 18 },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: { borderRadius: 999, textTransform: "none", fontFamily: headingFont },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { borderRadius: 14 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 14 },
        },
      },
    },
  }
}

const themeCache = new Map<ColorSchemeName, Theme>()

export function getTheme(name: ColorSchemeName): Theme {
  const cached = themeCache.get(name)
  if (cached) return cached

  const scheme = colorSchemes[name] ?? colorSchemes.default
  const theme = createTheme(buildOptions(scheme))
  themeCache.set(name, theme)
  return theme
}

/** Exposed so pages can reuse the scheme backdrop tone without re-deriving it. */
export function getBackdropColor(name: ColorSchemeName): string {
  return (colorSchemes[name] ?? colorSchemes.default).backdrop
}
