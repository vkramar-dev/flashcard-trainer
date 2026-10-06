import CheckIcon from "@mui/icons-material/Check";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { PageContainer } from "../components/PageContainer";
import { LoadingState } from "../components/StateViews";
import { SignedOutNotice } from "../features/auth/SignedOutNotice";
import {
  clearSettingsError,
  updateColorSchemeAsync,
  updateHideKnownCardsAsync,
} from "../features/settings/settingsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { colorSchemeLabels, colorSchemes } from "../theme";
import type { ColorSchemeName } from "../types";

function SchemeSwatch({ scheme }: { scheme: ColorSchemeName }) {
  const definition = colorSchemes[scheme];

  return (
    <Stack direction="row" gap={0.75} aria-hidden="true">
      {[definition.paper, definition.backdrop, definition.primary].map(
        (color) => (
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
        ),
      )}
    </Stack>
  );
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();

  const { colorScheme, availableColorSchemes, error, hideKnownCards } =
    useAppSelector((state) => state.settings);

  const { isAuthenticated, sessionChecked } = useAppSelector(
    (state) => state.auth,
  );

  if (!isAuthenticated) {
    return (
      <PageContainer
        title="Settings"
        description="Manage your training preferences."
        maxWidth="md"
      >
        {sessionChecked ? (
          <SignedOutNotice
            icon={<SettingsOutlinedIcon />}
            title="Sign in to manage settings"
            description="Your preferences are saved with your account and follow you across devices."
          />
        ) : (
          <LoadingState label="Checking your session..." />
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer title="" description="" maxWidth="md">
      <Stack gap={5}>
        {error && (
          <Alert
            severity="error"
            onClose={() => dispatch(clearSettingsError())}
          >
            {error}
          </Alert>
        )}

        <Box>
          <Card variant="outlined">
            <Box
              sx={{
                p: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="subtitle1">Hide learned words</Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25 }}
                >
                  Exclude learned words from future training sessions.
                </Typography>
              </Box>

              <Switch
                checked={hideKnownCards}
                onChange={(_, checked) =>
                  dispatch(updateHideKnownCardsAsync(checked))
                }
              />
            </Box>
          </Card>
        </Box>

        <Box>
          <Typography variant="h5" sx={{ mb: 1.6 }}>
            Color Settings
          </Typography>

          <Box
            role="radiogroup"
            aria-label="Color scheme"
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            {availableColorSchemes.map((scheme) => {
              const selected = scheme === colorScheme;

              return (
                <Card
                  key={scheme}
                  variant="outlined"
                  sx={{
                    borderColor: selected ? "primary.main" : "divider",
                    borderWidth: selected ? 2 : 1,
                  }}
                >
                  <CardActionArea
                    role="radio"
                    aria-checked={selected}
                    onClick={() => dispatch(updateColorSchemeAsync(scheme))}
                    sx={{ p: 2.5 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                    >
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
              );
            })}
          </Box>
        </Box>
      </Stack>
    </PageContainer>
  );
}
