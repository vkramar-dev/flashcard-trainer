import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import { Box, Button, Stack, Typography } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { FlashcardsIllustration } from "../../components/FlashcardsIllustration"
import { openAuthDialog } from "./authSlice"
import { useAppDispatch } from "../../store/hooks"

export function HomeSignedOutHero() {
  const dispatch = useAppDispatch()
  const theme = useTheme()

  const primary = theme.palette.primary.main

  const highlights = [
    "Create cards or import them from a CSV file",
    "Track what you know and what still needs practice",
    "Continue your training from any device",
  ]

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
            ${alpha(primary, 0.10)} 0%,
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
          Learn with Flashcards.
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
            lineHeight: 1.6,
            mb: 3,
          }}
        >
          Create sets, train with cards and continue learning from any device.
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
            Create account
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
            Sign in
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
  )
}