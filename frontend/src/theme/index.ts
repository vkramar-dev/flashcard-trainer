import { createTheme, type Theme, type ThemeOptions } from "@mui/material/styles"
import type { ColorSchemeName } from "../types"

export const colorSchemeLabels: Record<ColorSchemeName, string> = {
  coastal: "Coastal",
  porcelain: "Porcelain",
  mist: "Mist",
  slate: "Slate",
  espresso: "Espresso",
  graphite: "Graphite",
  indigo: "Indigo",
  midnight: "Midnight",
  forest: "Forest",
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
  coastal: {
    mode: "light",
    primary: "#4D76A8",
    secondary: "#B07A58",
    background: "#F2F1ED",
    paper: "#FFFDF8",
    backdrop: "#DFE5E9",
  },

  porcelain: {
    mode: "light",
    primary: "#4D76A8",
    secondary: "#B98268",
    background: "#F2F4F6",
    paper: "#FFFDF9",
    backdrop: "#E4E8EC",
  },

  mist: {
    mode: "light",
    primary: "#4D76A8",
    secondary: "#C08A6D",
    background: "#EDF2F6",
    paper: "#FBFCFD",
    backdrop: "#D9E2E9",
  },

  slate: {
    mode: "dark",
    primary: "#E0B66F",
    secondary: "#7FB6C9",
    background: "#34383D",
    paper: "#262A2E",
    backdrop: "#1B1E21",
  },

  espresso: {
    mode: "dark",
    primary: "#E1B57B", // caramel
    secondary: "#82B7A5", // muted sage
    background: "#3A302C", // warm taupe
    paper: "#29221F", // espresso
    backdrop: "#1B1715", // coffee black
  },

  graphite: {
    mode: "dark",
    primary: "#A6C6E3", // soft steel blue
    secondary: "#D5A36F", // bronze
    background: "#343A42", // graphite/slate
    paper: "#24282E", // neutral charcoal
    backdrop: "#191C20", // near-black graphite
  },

  indigo: {
    mode: "dark",
    primary: "#8BA8F8",
    secondary: "#C8A3EA",
    background: "#29354D",
    paper: "#20283A",
    backdrop: "#161C2A",
  },

  midnight: {
    mode: "dark",
    primary: "#72C7D4",
    secondary: "#E1B36B",
    background: "#294955", // muted teal
    paper: "#1D3039", // blue-grey
    backdrop: "#14242C", // deep navy
  },

  forest: {
    mode: "dark",
    primary: "#7BCDA7", // fresh mint
    secondary: "#D8A36D", // warm copper
    background: "#30483F", // muted sage / forest
    paper: "#222F2B", // charcoal spruce
    backdrop: "#17221E", // deep green-black
  },
};

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
            backgroundColor: scheme.backdrop,
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
