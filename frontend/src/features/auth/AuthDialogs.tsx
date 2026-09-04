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
import { useEffect, useState, type FormEvent } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { closeAuthDialog, openAuthDialog, signIn, signUp } from "./authSlice"

interface FieldErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthDialogs() {
  const dispatch = useAppDispatch()
  const view = useAppSelector((state) => state.auth.dialog)
  const status = useAppSelector((state) => state.auth.status)
  const serverError = useAppSelector((state) => state.auth.error)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})

  const isSignUp = view === "signUp"
  const isSubmitting = status === "loading"

  // Reset the form whenever the dialog is opened or switched.
  useEffect(() => {
    setPassword("")
    setConfirmPassword("")
    setErrors({})
  }, [view])

  const handleClose = () => {
    if (isSubmitting) return
    dispatch(closeAuthDialog())
  }

  const validate = (): boolean => {
    const next: FieldErrors = {}

    if (!email.trim()) next.email = "Email is required."
    else if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address."

    if (!password) next.password = "Password is required."
    else if (isSignUp && password.length < 6) next.password = "Use at least 6 characters."

    if (isSignUp) {
      if (!confirmPassword) next.confirmPassword = "Please confirm your password."
      else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match."
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    const credentials = { email: email.trim(), password }
    dispatch(isSignUp ? signUp(credentials) : signIn(credentials))
  }

  return (
    <Dialog open={view !== null} onClose={handleClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ pb: 1 }}>{isSignUp ? "Sign Up" : "Sign In"}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

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
              autoFocus
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
              />
            )}

            <Typography variant="body2" color="text.secondary">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => dispatch(openAuthDialog(isSignUp ? "signIn" : "signUp"))}
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
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
