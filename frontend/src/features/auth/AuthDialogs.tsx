import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { text } from "../../i18n"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  clearAuthError,
  googleSignInAsync,
  closeAuthDialog,
  openAuthDialog,
  sendRegistrationCodeAsync,
  signInAsync,
  signUpAsync,
} from "./authSlice"
import { GoogleSignInButton } from "./GoogleSignInButton"
import { ProjectConstants } from "../../utils/ProjectConstants"

interface FieldErrors {
  email?: string
  password?: string
  confirmPassword?: string
  code?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const codePattern = /^\d{3}$/

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function AuthDialogs() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const view = useAppSelector((state) => state.auth.dialog)
  const status = useAppSelector((state) => state.auth.status)
  const serverError = useAppSelector((state) => state.auth.error)
  const registrationFailure = useAppSelector((state) => state.auth.registrationFailure)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [codeExpAt, setCodeExpAt] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pendingAction, setPendingAction] = useState<"send" | "resend" | "verify" | "signIn" | "google" | null>(null)
  const requestLock = useRef(false)
  const viewRef = useRef(view)
  viewRef.current = view

  const isSignUp = view === "signUp"
  const isSubmitting = status === "loading" || pendingAction !== null
  const failureCode = registrationFailure?.code
  const remainingMs = codeExpAt ? new Date(codeExpAt).getTime() - now : 0
  const expiredLocally = codeSent && codeExpAt !== null && remainingMs <= 0
  const verificationLocked =
    codeSent &&
    (expiredLocally ||
      failureCode === "TooManyAttempts" ||
      failureCode === "CodeExpired" ||
      failureCode === "CodeRequired")

  let alertMessage: string | null = null
  if (failureCode !== "IpBlocked" && failureCode !== "InvalidCode") alertMessage = serverError
  if (failureCode === "EmailQuotaReached") alertMessage = "auth.emailQuotaReached"
  if (!alertMessage && expiredLocally && failureCode !== "TooManyAttempts") {
    alertMessage = "auth.codeExpired"
  }

  // Reset the form whenever the dialog is opened, closed, or switched.
  useEffect(() => {
    setPassword("")
    setConfirmPassword("")
    setCode("")
    setCodeSent(false)
    setCodeExpAt(null)
    setErrors({})
    if (view !== "signIn") setEmail("")
  }, [view])

  useEffect(() => {
    if (!codeSent || !codeExpAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [codeSent, codeExpAt])

  const handleClose = () => {
    if (isSubmitting) return
    dispatch(closeAuthDialog())
  }

  const validate = (includeCode: boolean): boolean => {
    const next: FieldErrors = {}

    const address = email.trim()
    if (!address) next.email = "auth.emailRequired"
    else if (address.length < ProjectConstants.userNameMinLength) {
      next.email = "auth.emailTooShort"
    } else if (address.length > ProjectConstants.userNameMaxLength) {
      next.email = "auth.emailTooLong"
    } else if (!emailPattern.test(address)) next.email = "auth.emailInvalid"

    if (!password) next.password = "auth.passwordRequired"
    else if (password.length < ProjectConstants.passwordMinLength) {
      next.password = "auth.passwordTooShort"
    } else if (password.length > ProjectConstants.passwordMaxLength) {
      next.password = "auth.passwordTooLong"
    }

    if (isSignUp) {
      if (!confirmPassword) next.confirmPassword = "auth.confirmRequired"
      else if (confirmPassword !== password) next.confirmPassword = "auth.passwordMismatch"
    }

    if (includeCode) {
      if (!code.trim()) next.code = "auth.codeRequired"
      else if (!codePattern.test(code.trim())) next.code = "auth.codeDigits"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const requestCode = async (action: "send" | "resend") => {
    if (requestLock.current || isSubmitting) return
    if (action === "send" && !validate(false)) return
    if (action === "resend" && !email.trim()) return

    const address = email.trim()
    requestLock.current = true
    setPendingAction(action)
    try {
      const result = await dispatch(sendRegistrationCodeAsync(address)).unwrap()
      if (viewRef.current !== "signUp") return
      setEmail(address)
      setCode("")
      setCodeExpAt(result.codeExpAt)
      setCodeSent(true)
      setNow(Date.now())
      setErrors((current) => ({ ...current, code: undefined }))
    } catch {
      // The slice stores the message for the dialog.
    } finally {
      requestLock.current = false
      setPendingAction(null)
    }
  }

  const handleGoogleCredential = async (credential: string) => {
    if (requestLock.current || isSubmitting) return
    requestLock.current = true
    setPendingAction("google")
    try {
      await dispatch(googleSignInAsync(credential)).unwrap()
    } catch {
      // Error is localized and displayed from authSlice.
    } finally {
      requestLock.current = false
      setPendingAction(null)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requestLock.current || isSubmitting) return

    if (!isSignUp) {
      if (!validate(false)) return
      requestLock.current = true
      setPendingAction("signIn")
      try {
        await dispatch(signInAsync({ email: email.trim(), password }))
      } finally {
        requestLock.current = false
        setPendingAction(null)
      }
      return
    }

    if (!codeSent) {
      await requestCode("send")
      return
    }

    if (verificationLocked || !validate(true)) return

    requestLock.current = true
    setPendingAction("verify")
    try {
      await dispatch(signUpAsync({ email: email.trim(), password, code: code.trim() }))
    } finally {
      requestLock.current = false
      setPendingAction(null)
    }
  }

  const fieldText = (key: string | undefined) =>
    key
      ? t(key, {
          min: ProjectConstants.userNameMinLength,
          max: ProjectConstants.userNameMaxLength,
        })
      : undefined

  const passwordText = (key: string | undefined) =>
    key
      ? t(key, {
          min: ProjectConstants.passwordMinLength,
          max: ProjectConstants.passwordMaxLength,
        })
      : undefined

  const codeHelperText = errors.code
    ? t(errors.code)
    : failureCode === "InvalidCode" && !verificationLocked
      ? registrationFailure?.message
      : undefined

  return (
    <>
      <Dialog open={view === "signIn" || view === "signUp"} onClose={handleClose} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit} noValidate>
          <DialogTitle sx={{ pb: 1.5 }}>
            {isSignUp ? t("auth.signUpTitle") : t("auth.signInTitle")}
          </DialogTitle>
          <Divider sx={{ mx: 3, borderColor: "divider" }} />
          <DialogContent sx={{ pt: 3 }}>
            <Stack gap={2} sx={{ pt: 0.5 }}>
              {alertMessage && <Alert severity="error">{text(alertMessage)}</Alert>}

              {!codeSent && (
                <>
                  <GoogleSignInButton
                    onCredential={(credential) => void handleGoogleCredential(credential)}
                    disabled={isSubmitting}
                  />
                  <Divider sx={{ my: 0.25 }}>{t("auth.or")}</Divider>
                </>
              )}

              <TextField
                label={t("auth.email")}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(errors.email)}
                helperText={fieldText(errors.email)}
                required
                fullWidth
                disabled={codeSent}
                slotProps={{ htmlInput: { maxLength: ProjectConstants.userNameMaxLength } }}
              />

              <TextField
                label={t("auth.password")}
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(errors.password)}
                helperText={passwordText(errors.password)}
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: ProjectConstants.passwordMaxLength } }}
              />

              {isSignUp && (
                <TextField
                  label={t("auth.confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  error={Boolean(errors.confirmPassword)}
                  helperText={passwordText(errors.confirmPassword)}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: ProjectConstants.passwordMaxLength } }}
                />
              )}

              {isSignUp && codeSent && (
                <>
                  <TextField
                    label={t("auth.verificationCode")}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 3))}
                    error={Boolean(codeHelperText)}
                    helperText={codeHelperText ?? t("auth.codeHelper")}
                    required
                    fullWidth
                    autoFocus
                    disabled={verificationLocked}
                    slotProps={{ htmlInput: { inputMode: "numeric", autoComplete: "one-time-code", maxLength: 3 } }}
                  />
                  {!verificationLocked && (
                    <Typography variant="body2" color="text.secondary">
                      {t("auth.codeExpires", { time: formatRemaining(remainingMs) })}
                    </Typography>
                  )}
                </>
              )}

              {!isSignUp && (
                <Typography variant="body2" sx={{ textAlign: "right" }}>
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => {
                      if (!isSubmitting) dispatch(openAuthDialog("forgotPassword"))
                    }}
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary">
                {isSignUp ? `${t("auth.alreadyHave")} ` : `${t("auth.dontHave")} `}
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => {
                    if (isSubmitting) return
                    dispatch(openAuthDialog(isSignUp ? "signIn" : "signUp"))
                  }}
                >
                  {isSignUp ? t("auth.signInTitle") : t("auth.signUpTitle")}
                </Link>
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
              {t("common.cancel")}
            </Button>
            {isSignUp && codeSent && (
              <Button
                type="button"
                onClick={() => void requestCode("resend")}
                disabled={isSubmitting}
                startIcon={pendingAction === "resend" ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {t("auth.resendCode")}
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || (isSignUp && codeSent && verificationLocked)}
              startIcon={
                pendingAction === "send" || pendingAction === "verify" || pendingAction === "signIn" ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {isSignUp ? (codeSent ? t("auth.signUpTitle") : t("auth.sendCode")) : t("auth.signInTitle")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={isSignUp && failureCode === "IpBlocked"}
        onClose={() => dispatch(clearAuthError())}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("auth.blockedTitle")}</DialogTitle>
        <DialogContent>
          <Typography>{registrationFailure?.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => dispatch(clearAuthError())} variant="contained">
            {t("common.ok")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
