import { Box, Typography, useTheme } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { initializeGoogleIdentity, loadGoogleIdentity, registerGoogleCredentialHandler } from "./googleIdentity"

interface Props {
  onCredential: (credential: string) => void
  disabled?: boolean
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

export function GoogleSignInButton({ onCredential, disabled = false }: Props) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  const [loadFailed, setLoadFailed] = useState(false)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!clientId) return

    const container = containerRef.current
    if (!container) return

    setLoadFailed(false)
    let disposed = false
    let unregister: (() => void) | undefined

    void loadGoogleIdentity()
      .then(() => {
        if (disposed || !container.isConnected) return
        const api = initializeGoogleIdentity(clientId)
        unregister = registerGoogleCredentialHandler((credential) => callbackRef.current(credential))

        // Keep the official, functional Google button; the outer shell supplies the chip styling.
        container.replaceChildren()
        api.renderButton(container, {
          type: "standard",
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          locale: i18n.language === "zh-hans" ? "zh-CN" : i18n.language === "pt" ? "pt-PT" : i18n.language,
        })
      })
      .catch(() => {
        if (!disposed) setLoadFailed(true)
      })

    return () => {
      disposed = true
      unregister?.()
    }
  }, [i18n.language, isDark])

  const accentColor = theme.palette.primary.main

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Box
        sx={{
          display: "inline-flex",
          maxWidth: "100%",
          p: "4px",
          borderRadius: 999,
          border: `1.5px solid ${alpha(accentColor, isDark ? 0.72 : 0.52)}`,
          backgroundColor: alpha(accentColor, isDark ? 0.09 : 0.045),
          boxShadow: `0 3px 10px ${alpha(accentColor, isDark ? 0.10 : 0.08)}`,
          verticalAlign: "middle",
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
          transition: "border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
          "&:hover": disabled
            ? undefined
            : {
                borderColor: accentColor,
                backgroundColor: alpha(accentColor, isDark ? 0.16 : 0.085),
                boxShadow: `0 5px 16px ${alpha(accentColor, isDark ? 0.23 : 0.18)}`,
                transform: "translateY(-1px)",
              },
          "&:focus-within": {
            outline: `2px solid ${accentColor}`,
            outlineOffset: 3,
          },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            "&:hover": { transform: "none" },
          },
        }}
      >
        <Box
          ref={containerRef}
          sx={{ display: "flex", justifyContent: "center", minHeight: 40, maxWidth: "100%" }}
          aria-label={t("auth.googleButton")}
        />
      </Box>
      {!clientId && (
        <Typography variant="caption" color="error">{t("auth.googleNotConfigured")}</Typography>
      )}
      {loadFailed && (
        <Typography variant="caption" color="error">{t("auth.googleUnavailable")}</Typography>
      )}
    </Box>
  )
}
