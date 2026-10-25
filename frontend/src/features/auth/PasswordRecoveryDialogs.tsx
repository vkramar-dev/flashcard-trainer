import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import axios from "axios"
import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { authApi } from "../../api/authApi"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { closeAuthDialog, openAuthDialog } from "./authSlice"
import { ProjectConstants } from "../../utils/ProjectConstants"

interface ResetLink {
  email: string
  token: string
}

function readResetLink(): ResetLink | null {
  const hash = window.location.hash
  if (!hash.startsWith("#reset-password?")) return null
  const params = new URLSearchParams(hash.slice("#reset-password?".length))
  const email = params.get("email")
  const token = params.get("token")
  return email && token ? { email, token } : null
}

function clearResetLink() {
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search,
  )
}

export function PasswordRecoveryDialogs() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const dialog = useAppSelector((state) => state.auth.dialog)
  const [resetLink, setResetLink] = useState<ResetLink | null>(readResetLink)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onHashChange = () => {
      setResetLink(readResetLink())
      setDone(false)
      setError(null)
      setPassword("")
      setConfirmPassword("")
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const resetMode = resetLink !== null
  const forgotMode = dialog === "forgotPassword" && !resetMode
  const open = resetMode || forgotMode

  const close = () => {
    if (busy) return
    if (resetMode) {
      clearResetLink()
      setResetLink(null)
    }
    if (dialog === "forgotPassword") dispatch(closeAuthDialog())
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setError(null)
    setDone(false)
  }

  const showSignIn = () => {
    close()
    dispatch(openAuthDialog("signIn"))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || done) return
    setError(null)

    if (resetMode) {
      if (
        password.length < ProjectConstants.passwordMinLength ||
        password.length > ProjectConstants.passwordMaxLength
      ) {
        setError(t("auth.passwordSize", {
          min: ProjectConstants.passwordMinLength,
          max: ProjectConstants.passwordMaxLength,
        }))
        return
      }
      if (password !== confirmPassword) {
        setError(t("auth.passwordMismatch"))
        return
      }
    } else {
      const address = email.trim()
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!address) setError(t("auth.emailRequired"))
      else if (address.length < ProjectConstants.userNameMinLength)
        setError(t("auth.emailTooShort", { min: ProjectConstants.userNameMinLength }))
      else if (address.length > ProjectConstants.userNameMaxLength)
        setError(t("auth.emailTooLong", { max: ProjectConstants.userNameMaxLength }))
      else if (!emailPattern.test(address)) setError(t("auth.emailInvalid"))
      else setError(null)

      if (!address || address.length < ProjectConstants.userNameMinLength ||
          address.length > ProjectConstants.userNameMaxLength || !emailPattern.test(address))
        return
    }

    setBusy(true)
    try {
      if (resetLink) {
        await authApi.resetPassword(resetLink.email, resetLink.token, password)
      } else {
        await authApi.forgotPassword(email.trim())
      }
      setDone(true)
    } catch (err) {
      if (resetMode && axios.isAxiosError(err) && err.response?.status === 400) {
        setError(t("auth.resetInvalid"))
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        setError(t("auth.tooManyRequests"))
      } else {
        setError(t("auth.recoveryFailed"))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1.5 }}>{t(resetMode ? "auth.resetPassword" : "auth.forgotPassword")}</DialogTitle>
      <Divider sx={{ mx: 3 }} />
      <form onSubmit={(event) => void submit(event)} noValidate>
        <DialogContent sx={{ pt: 3 }}>
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              {t(done
                ? resetMode ? "auth.resetDone" : "auth.forgotDone"
                : resetMode ? "auth.resetHelp" : "auth.forgotHelp")}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {!done && (resetMode ? (
              <>
                <TextField
                  label={t("auth.email")}
                  value={resetLink.email}
                  disabled
                  fullWidth
                />
                <TextField
                  label={t("auth.newPassword")}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: ProjectConstants.passwordMaxLength } }}
                  required
                  fullWidth
                />
                <TextField
                  label={t("auth.confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: ProjectConstants.passwordMaxLength } }}
                  required
                  fullWidth
                />
              </>
            ) : (
              <TextField
                label={t("auth.email")}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                slotProps={{ htmlInput: { maxLength: ProjectConstants.userNameMaxLength } }}
                required
                fullWidth
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {done ? (
            <Button onClick={showSignIn} variant="contained">{t("auth.signInTitle")}</Button>
          ) : (
            <>
              <Button onClick={close} disabled={busy} color="inherit">{t("common.cancel")}</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={busy}
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {t(resetMode ? "auth.savePassword" : "auth.sendResetLink")}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}
