import AddIcon from "@mui/icons-material/Add";
import { FlashcardsIllustration } from "../../components/FlashcardsIllustration"
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type SetsEmptyHeroProps = {
  onCreate: () => void;
};

export function SetsEmptyHero({ onCreate }: SetsEmptyHeroProps) {
  const theme = useTheme();

  const primary = theme.palette.primary.main;

  return (
    <Box
      sx={{
        minHeight: { xs: 500, md: 610 },
        display: "flex",
        justifyContent: "center",
        alignItems: { xs: "flex-start", md: "center" },
        position: "relative",
        overflow: "hidden",
        pt: { xs: 5, md: 0 },
        pb: 6,
      }}
    >
      {/* Background glow */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: { xs: 420, md: 680 },
          height: { xs: 420, md: 680 },
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
          maxWidth: 720,
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
              xs: "1.8rem",
              sm: "2.15rem",
              md: "2.6rem",
            },
            mb: 1.5,
          }}
        >
          Create your first set
        </Typography>

        <Typography
          sx={{
            color: "text.secondary",
            maxWidth: 520,
            fontSize: {
              xs: "0.95rem",
              md: "1.05rem",
            },
            lineHeight: 1.5,
            mb: 3,
          }}
        >
          Add flashcards and start training in minutes.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{
            minHeight: 48,
            px: 3.5,
            borderRadius: 999,
            fontSize: "0.95rem",
            fontWeight: 700,
            textTransform: "none",

            boxShadow: `0 10px 32px ${alpha(primary, 0.28)}`,

            transition: "transform 160ms ease, box-shadow 160ms ease",

            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: `0 12px 38px ${alpha(primary, 0.38)}`,
            },
          }}
        >
          Create first set
        </Button>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 2.5,
            fontSize: "0.8rem",
            opacity: 0.8,
          }}
        >
          You can import cards after creating a set.
        </Typography>
      </Stack>
    </Box>
  );
}
