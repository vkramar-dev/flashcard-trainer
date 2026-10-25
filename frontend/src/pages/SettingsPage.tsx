import CheckIcon from "@mui/icons-material/Check";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Stack,
  TextField,
  MenuItem,
  Switch,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { text } from "../i18n";
import { PageContainer } from "../components/PageContainer";
import { LoadingState } from "../components/StateViews";
import { SignedOutNotice } from "../features/auth/SignedOutNotice";
import { GoogleAccountLink } from "../features/auth/GoogleAccountLink";
import {
  clearSettingsError,
  updateColorSchemeAsync,
  updateHideKnownCardsAsync,
  updateMaxCardsPerTrainingSessionAsync,
} from "../features/settings/settingsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { colorSchemes } from "../theme";
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
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { colorScheme, availableColorSchemes, error, hideKnownCards, maxCardsPerTrainingSession } =
    useAppSelector((state) => state.settings);

  const { isAuthenticated, sessionChecked } = useAppSelector(
    (state) => state.auth,
  );

  if (!isAuthenticated) {
    return (
      <PageContainer
        title={t("settings.title")}
        description={t("settings.description")}
        maxWidth="md"
      >
        {sessionChecked ? (
          <SignedOutNotice
            icon={<SettingsOutlinedIcon />}
            title={t("settings.signedOutTitle")}
            description={t("settings.signedOutBody")}
          />
        ) : (
          <LoadingState label="home.checkingSession" />
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
            {text(error)}
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
                <Typography variant="subtitle1">{t("settings.hideLearned")}</Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25 }}
                >
                  {t("settings.hideLearnedHelp")}
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

        <Card variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="subtitle1">{t("settings.maxCards")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {t("settings.maxCardsHelp")}
            </Typography>
          </Box>
          <TextField
            select
            SelectProps={{ inputProps: { "aria-label": t("settings.cardsPerSession") } }}
            value={maxCardsPerTrainingSession}
            onChange={(event) => dispatch(updateMaxCardsPerTrainingSessionAsync(Number(event.target.value)))}
            sx={{ width: 90, ml: "auto" }}
          >
            {[10, 20, 50, 100, 200, 0].map((value) => (
              <MenuItem key={value} value={value}>{value === 0 ? t("common.all") : value}</MenuItem>
            ))}
          </TextField>
        </Card>

        <GoogleAccountLink />

        <Box>
          <Typography variant="h5" sx={{ mb: 1.6 }}>
            {t("settings.colorSettings")}
          </Typography>

          <Box
            role="radiogroup"
            aria-label={t("settings.colorScheme")}
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
                          {t(`themes.${scheme}`)}
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
