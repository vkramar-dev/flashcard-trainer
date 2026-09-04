import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material"
import { openAuthDialog } from "./authSlice"
import { useAppDispatch } from "../../store/hooks"

interface SignedOutNoticeProps {
  /** Short headline explaining what needs an account, e.g. "Your sets live in your account". */
  title: string
  /** One or two sentences describing why this page is empty while signed out. */
  description: string
  /** Optional list of what becomes available after signing in. */
  highlights?: string[]
}

/**
 * Shown instead of page content when the visitor is not signed in.
 * Home, Statistics and Settings all depend on the account, so each of them
 * renders this with its own wording plus the sign in / sign up actions.
 */
export function SignedOutNotice({ title, description, highlights }: SignedOutNoticeProps) {
  const dispatch = useAppDispatch()

  return (
    <Card sx={{ maxWidth: 560, mx: "auto" }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: "center" }}>
        <Box
          aria-hidden
          sx={{
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            mx: "auto",
            mb: 2,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <LockOutlinedIcon fontSize="small" />
        </Box>

        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mx: "auto", maxWidth: "44ch" }}>
          {description}
        </Typography>

        {highlights && highlights.length > 0 && (
          <Stack component="ul" gap={1} sx={{ listStyle: "none", m: 0, mt: 3, p: 0, textAlign: "left" }}>
            {highlights.map((item) => (
              <Stack component="li" key={item} direction="row" alignItems="flex-start" gap={1}>
                <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mt: "2px" }} />
                <Typography variant="body2" color="text.secondary">
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="center" sx={{ mt: 3 }}>
          <Button variant="contained" onClick={() => dispatch(openAuthDialog("signIn"))}>
            Sign In
          </Button>
          <Button variant="outlined" onClick={() => dispatch(openAuthDialog("signUp"))}>
            Sign Up
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Creating an account takes a moment and keeps your cards and progress on every device.
        </Typography>
      </CardContent>
    </Card>
  )
}
