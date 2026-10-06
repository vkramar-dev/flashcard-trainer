import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  clearAuthError,
  closeAuthDialog,
  openAuthDialog,
  sendRegistrationCodeAsync,
  signInAsync,
  signUpAsync,
} from "./authSlice"
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
  const [pendingAction, setPendingAction] = useState<"send" | "resend" | "verify" | "signIn" | null>(null)
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
  if (!alertMessage && expiredLocally && failureCode !== "TooManyAttempts") {
    alertMessage = "This code has expired. Request a new code."
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
    if (!address) next.email = "Email is required."
    else if (address.length < ProjectConstants.userNameMinLength) {
      next.email = `Email must be at least ${ProjectConstants.userNameMinLength} characters.`
    } else if (address.length > ProjectConstants.userNameMaxLength) {
      next.email = `Email cannot be longer than ${ProjectConstants.userNameMaxLength} characters.`
    } else if (!emailPattern.test(address)) next.email = "Enter a valid email address."

    if (!password) next.password = "Password is required."
    else if (password.length < ProjectConstants.passwordMinLength) {
      next.password = `Use at least ${ProjectConstants.passwordMinLength} characters.`
    } else if (password.length > ProjectConstants.passwordMaxLength) {
      next.password = `Password cannot be longer than ${ProjectConstants.passwordMaxLength} characters.`
    }

    if (isSignUp) {
      if (!confirmPassword) next.confirmPassword = "Please confirm your password."
      else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match."
    }

    if (includeCode) {
      if (!code.trim()) next.code = "Enter the verification code."
      else if (!codePattern.test(code.trim())) next.code = "Enter the 3-digit code."
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

  const codeHelperText =
    errors.code ??
    (failureCode === "InvalidCode" && !verificationLocked ? registrationFailure?.message : undefined)

  return (
    <>
      <Dialog open={view !== null} onClose={handleClose} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit} noValidate>
          <DialogTitle sx={{ pb: 1 }}>{isSignUp ? "Sign Up" : "Sign In"}</DialogTitle>
          <DialogContent>
            <Stack gap={2} sx={{ pt: 0.5 }}>
              {alertMessage && <Alert severity="error">{alertMessage}</Alert>}

              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
                fullWidth
                autoFocus={!codeSent}
                disabled={codeSent}
                slotProps={{ htmlInput: { maxLength: ProjectConstants.userNameMaxLength } }}
              />

              <TextField
                label="Password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(errors.password)}
                helperText={errors.password}
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: ProjectConstants.passwordMaxLength } }}
              />

              {isSignUp && (
                <TextField
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: ProjectConstants.passwordMaxLength } }}
                />
              )}

              {isSignUp && codeSent && (
                <>
                  <TextField
                    label="Verification code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 3))}
                    error={Boolean(codeHelperText)}
                    helperText={codeHelperText ?? "Enter the 3-digit code from your email."}
                    required
                    fullWidth
                    autoFocus
                    disabled={verificationLocked}
                    slotProps={{ htmlInput: { inputMode: "numeric", autoComplete: "one-time-code", maxLength: 3 } }}
                  />
                  {!verificationLocked && (
                    <Typography variant="body2" color="text.secondary">
                      Code expires in {formatRemaining(remainingMs)}.
                    </Typography>
                  )}
                </>
              )}

              <Typography variant="body2" color="text.secondary">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => {
                    if (isSubmitting) return
                    dispatch(openAuthDialog(isSignUp ? "signIn" : "signUp"))
                  }}
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Link>
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
              Cancel
            </Button>
            {isSignUp && codeSent && (
              <Button
                type="button"
                onClick={() => void requestCode("resend")}
                disabled={isSubmitting}
                startIcon={pendingAction === "resend" ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                Resend code
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
              {isSignUp ? (codeSent ? "Sign Up" : "Send code") : "Sign In"}
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
        <DialogTitle>Registration blocked</DialogTitle>
        <DialogContent>
          <Typography>{registrationFailure?.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => dispatch(clearAuthError())} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
