import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { FlashcardsIllustration } from "../../components/FlashcardsIllustration";
import { openAuthDialog } from "./authSlice";
import { useAppDispatch } from "../../store/hooks";

export function HomeSignedOutHero() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const primary = theme.palette.primary.main;

  const highlights = [
    t("home.highlightCreate"),
    t("home.highlightTrack"),
    t("home.highlightResume"),
  ];

  return (
    <Box
      sx={{
        minHeight: { xs: 560, md: 650 },
        display: "flex",
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        pt: { xs: 4, md: 0 },
        pb: 6,
      }}
    >
      {/* Background glow */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: { xs: 460, md: 760 },
          height: { xs: 460, md: 760 },
          borderRadius: "50%",
          background: `radial-gradient(
            circle,
            ${alpha(primary, 0.1)} 0%,
            ${alpha(primary, 0.035)} 42%,
            transparent 72%
          )`,
          pointerEvents: "none",
        }}
      />

      <Stack
        alignItems="center"
        textAlign="center"
        sx={{
          width: "100%",
          maxWidth: 760,
          position: "relative",
          zIndex: 1,
        }}
      >
        <FlashcardsIllustration />

        <Typography
          component="h1"
          sx={{
            color: "text.primary",
            fontWeight: 750,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            fontSize: {
              xs: "2rem",
              sm: "2.3rem",
              md: "2.8rem",
            },
            mb: 1.5,
          }}
        >
          {t("home.heroTitle")}
          {/* <br />
          Keep your progress. */}
        </Typography>

        <Typography
          sx={{
            color: "text.secondary",
            maxWidth: 560,
            fontSize: {
              xs: "0.95rem",
              md: "1.05rem",
            },
            lineHeight: 1.5,
            mb: 1.5,
          }}
        >
          {t("home.heroSubtitle")}
        </Typography>

        <Typography
          sx={{
            color: "primary.main",
            fontSize: {
              xs: "0.7rem",
              sm: "0.8rem",
            },
            fontWeight: 600,
            letterSpacing: "0.015em",
            mb: 3,
          }}
        >
          {t("home.heroFree")}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="center"
          sx={{ mb: 3.5 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => dispatch(openAuthDialog("signUp"))}
            sx={{
              minHeight: 48,
              px: 3.5,
              fontSize: "0.95rem",
              fontWeight: 700,
              boxShadow: `0 10px 30px ${alpha(primary, 0.25)}`,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: `0 12px 36px ${alpha(primary, 0.34)}`,
              },
              transition: "transform 160ms ease, box-shadow 160ms ease",
            }}
          >
            {t("home.createAccount")}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => dispatch(openAuthDialog("signIn"))}
            sx={{
              minHeight: 48,
              px: 3.5,
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            {t("home.signIn")}
          </Button>
        </Stack>

        <Stack
          spacing={1.1}
          sx={{
            width: { xs: "100%", sm: "fit-content" },
            maxWidth: "100%",
            textAlign: "left",
            mx: "auto",
            px: { xs: 2, sm: 0 },
          }}
        >
          {highlights.map((item) => (
            <Stack
              key={item}
              direction="row"
              spacing={1.2}
              alignItems="flex-start"
            >
              <CheckCircleOutlineIcon
                color="primary"
                sx={{
                  fontSize: 20,
                  mt: "2px",
                  flexShrink: 0,
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: "0.9rem",
                }}
              >
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
