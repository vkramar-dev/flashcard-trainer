import { Alert, Card, Stack, Typography } from "@mui/material"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { text } from "../../i18n"
import { useAppDispatch } from "../../store/hooks"
import { linkGoogleAsync } from "./authSlice"
import { GoogleSignInButton } from "./GoogleSignInButton"

/** An existing password account must explicitly link Google; matching email alone is not enough. */
export function GoogleAccountLink() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [linking, setLinking] = useState(false)
  const [linked, setLinked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const link = async (credential: string) => {
    if (linking || linked) return
    setLinking(true)
    setError(null)
    try {
      await dispatch(linkGoogleAsync(credential)).unwrap()
      setLinked(true)
    } catch (reason) {
      setError(typeof reason === "string" ? reason : "auth.googleLinkFailed")
    } finally {
      setLinking(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack gap={1.5}>
        <Typography variant="subtitle1">{t("auth.googleLinkTitle")}</Typography>
        <Typography variant="body2" color="text.secondary">{t("auth.googleLinkHelp")}</Typography>
        {linked ? (
          <Alert severity="success">{t("auth.googleLinkedSuccess")}</Alert>
        ) : (
          <GoogleSignInButton onCredential={(credential) => void link(credential)} disabled={linking} />
        )}
        {error && <Alert severity="error" onClose={() => setError(null)}>{text(error)}</Alert>}
      </Stack>
    </Card>
  )
}
