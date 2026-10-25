import { Box, Typography } from "@mui/material"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  const [loadFailed, setLoadFailed] = useState(false)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!clientId) return

    setLoadFailed(false)
    let disposed = false
    let unregister: (() => void) | undefined
    void loadGoogleIdentity()
      .then(() => {
        if (disposed || !containerRef.current) return
        const api = initializeGoogleIdentity(clientId)
        unregister = registerGoogleCredentialHandler((credential) => callbackRef.current(credential))
        containerRef.current.replaceChildren()
        api.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          width: Math.max(200, Math.min(300, containerRef.current.clientWidth || 300)),
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
  }, [i18n.language])

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box
        ref={containerRef}
        sx={{ display: "flex", justifyContent: "center", minHeight: 40, opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto" }}
        aria-label={t("auth.googleButton")}
      />
      {!clientId && (
        <Typography variant="caption" color="error">{t("auth.googleNotConfigured")}</Typography>
      )}
      {loadFailed && (
        <Typography variant="caption" color="error">{t("auth.googleUnavailable")}</Typography>
      )}
    </Box>
  )
}
