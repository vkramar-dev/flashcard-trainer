import CheckIcon from "@mui/icons-material/Check"
import { Alert, Box, Card, CardActionArea, Stack, Typography } from "@mui/material"
import { useEffect } from "react"
import { PageContainer } from "../components/PageContainer"
import { LoadingState } from "../components/StateViews"
import { SignedOutNotice } from "../features/auth/SignedOutNotice"
import { clearSettingsError, fetchSettings, updateColorScheme } from "../features/settings/settingsSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { colorSchemeLabels, colorSchemes } from "../theme"
import type { ColorSchemeName } from "../types"

function SchemeSwatch({ scheme }: { scheme: ColorSchemeName }) {
  const definition = colorSchemes[scheme]
  return (
    <Stack direction="row" gap={0.75} aria-hidden="true">
      {[definition.background, definition.primary, definition.secondary].map((color) => (
        <Box
          key={color}
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: color,
            border: "1px solid",
            borderColor: "divider",
          }}
        />
      ))}
    </Stack>
  )
}

export default function SettingsPage() {
  const dispatch = useAppDispatch()
  const { colorScheme, availableColorSchemes, error } = useAppSelector((state) => state.settings)
  const { isAuthenticated, sessionChecked } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) return
    dispatch(fetchSettings())
  }, [dispatch, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <PageContainer
        title="Settings"
        description="Settings are stored with your account, so there is nothing to change while you are signed out."
        maxWidth="md"
      >
        {sessionChecked ? (
          <SignedOutNotice
            title="Sign in to change your settings"
            description="Your color scheme is saved to your account so it follows you everywhere. Sign in to choose one, or create an account first."
            highlights={[
              "Choose from every available color scheme",
              "Your choice is saved to your account, not just this browser",
              "The same look applies on every device you sign in from",
            ]}
          />
        ) : (
          <LoadingState label="Checking your session..." />
        )}
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Settings"
      description="Pick a color scheme. The choice is saved to your account and applies everywhere in the app."
      maxWidth="md"
    >
      <Stack gap={3}>
        {error && (
          <Alert severity="error" onClose={() => dispatch(clearSettingsError())}>
            {error}
          </Alert>
        )}

        <Box
          role="radiogroup"
          aria-label="Color scheme"
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {availableColorSchemes.map((scheme) => {
            const selected = scheme === colorScheme
            return (
              <Card
                key={scheme}
                sx={{
                  borderColor: selected ? "primary.main" : undefined,
                  borderWidth: selected ? 2 : 1,
                }}
              >
                <CardActionArea
                  role="radio"
                  aria-checked={selected}
                  onClick={() => dispatch(updateColorScheme(scheme))}
                  sx={{ p: 2.5 }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                    <Stack gap={1.5}>
                      <SchemeSwatch scheme={scheme} />
                      <Typography variant="subtitle1" component="p">
                        {colorSchemeLabels[scheme]}
                      </Typography>
                    </Stack>
                    {selected && <CheckIcon color="primary" />}
                  </Stack>
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
      </Stack>
    </PageContainer>
  )
}
