import { Box, ButtonBase, Popover, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { selectLanguage } from "../i18n"
import {
  isLanguageAvailable,
  languageLabel,
  languageOptions,
  normalizeLanguage,
  type AppLanguage,
} from "../i18n/language"

const columns = 3

function enabledNeighbor(index: number, key: string): number | null {
  const delta =
    key === "ArrowRight" ? 1
    : key === "ArrowLeft" ? -1
    : key === "ArrowDown" ? columns
    : key === "ArrowUp" ? -columns
    : null
  if (delta === null) return null

  const row = Math.floor(index / columns)
  let next = index + delta
  while (next >= 0 && next < languageOptions.length) {
    const crossedRow = key === "ArrowLeft" || key === "ArrowRight"
    if (crossedRow && Math.floor(next / columns) !== row) return null
    if (isLanguageAvailable(languageOptions[next].code)) return next
    next += delta
  }
  return null
}

export function LanguagePicker() {
  const { t, i18n } = useTranslation()
  const current: AppLanguage = normalizeLanguage(i18n.resolvedLanguage) ?? "en"
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const cells = useRef<Array<HTMLButtonElement | null>>([])
  const open = Boolean(anchor)

  useEffect(() => {
    if (!open) return
    const selected = languageOptions.findIndex((option) => option.code === current)
    cells.current[selected]?.focus()
  }, [open, current])

  const choose = (code: string) => {
    if (!isLanguageAvailable(code)) return
    selectLanguage(code)
    setAnchor(null)
  }

  const onCellKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      const enabled = languageOptions
        .map((option, optionIndex) => (isLanguageAvailable(option.code) ? optionIndex : -1))
        .filter((optionIndex) => optionIndex >= 0)
      const target = event.key === "Home" ? enabled[0] : enabled[enabled.length - 1]
      if (target !== undefined) cells.current[target]?.focus()
      return
    }

    const next = enabledNeighbor(index, event.key)
    if (next === null) return
    event.preventDefault()
    cells.current[next]?.focus()
  }

  return (
    <>
      <ButtonBase
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("nav.language")}, ${languageOptions.find((option) => option.code === current)?.name ?? current}`}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: "8px",
          border: 1,
          borderColor: "divider",
          color: "text.primary",
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          lineHeight: 1,
          "&:hover": {
            bgcolor: "action.hover",
            borderColor: "text.secondary",
          },
        }}
      >
        {languageLabel(current)}
      </ButtonBase>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        marginThreshold={12}
        elevation={0}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 1,
              width: "min(312px, calc(100vw - 24px))",
              borderRadius: "12px",
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 10px 28px rgba(0,0,0,0.4)"
                  : "0 10px 28px rgba(31,41,51,0.1)",
            },
          },
        }}
      >
        <Box
          role="listbox"
          aria-label={t("nav.language")}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 0.5,
          }}
        >
          {languageOptions.map((option, index) => {
            const available = isLanguageAvailable(option.code)
            const selected = option.code === current
            return (
              <ButtonBase
                key={option.code}
                ref={(node) => {
                  cells.current[index] = node
                }}
                role="option"
                aria-selected={selected}
                aria-disabled={!available}
                disabled={!available}
                onClick={() => choose(option.code)}
                onKeyDown={(event) => onCellKeyDown(event, index)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 72,
                  px: 0.5,
                  borderRadius: "8px",
                  color: selected ? "primary.main" : "text.primary",
                  bgcolor: (theme) =>
                    selected ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.1) : "transparent",
                  transition: "background-color 140ms ease, color 140ms ease",
                  "&:hover": {
                    bgcolor: (theme) =>
                      selected
                        ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.16)
                        : theme.palette.action.hover,
                  },
                  "&.Mui-disabled": {
                    opacity: 1,
                    color: "text.disabled",
                  },
                }}
              >
                <Typography
                  component="span"
                  sx={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.04em", lineHeight: 1.1 }}
                >
                  {option.label}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    mt: 0.5,
                    fontSize: "0.7rem",
                    lineHeight: 1.2,
                    color: "inherit",
                    opacity: selected || !available ? 1 : 0.72,
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {option.name}
                </Typography>
              </ButtonBase>
            )
          })}
        </Box>
      </Popover>
    </>
  )
}
