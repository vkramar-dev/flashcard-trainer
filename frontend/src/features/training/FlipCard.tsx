import { Box, Paper, Typography } from "@mui/material";
import type { CardSide } from "../../types";

interface FlipCardProps {
  front: string;
  back: string;
  side: CardSide;
  onFlip: () => void;
}

const faceStyles = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: { xs: 3, sm: 5 },
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
} as const;

function getCardFontSize(text: string) {

  const length = text.length;
  const lines = text.split(/\r?\n/).length;

  if (length > 240 || lines >= 8) {
    return { xs: "1rem", sm: "1.2rem" };
  }

  if (length > 180 || lines >= 6) {
    return { xs: "1.15rem", sm: "1.35rem" };
  }

  if (length > 120 || lines >= 5) {
    return { xs: "1.3rem", sm: "1.55rem" };
  }

  if (length > 70 || lines >= 4) {
    return { xs: "1.5rem", sm: "1.8rem" };
  }

  return { xs: "1.75rem", sm: "2.125rem" };
}

/** A flashcard that rotates in 3D between its front and back side when activated. */
export function FlipCard({ front, back, side, onFlip }: FlipCardProps) {
  const flipped = side === "back";

  if (front == null || back == null) {
    return null;
  }

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Flashcard, showing the ${side}. Activate to flip.`}
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
      sx={{
        perspective: "1600px",
        cursor: "pointer",
        outline: "none",
        borderRadius: 3,
        "&:focus-visible": {
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}55`,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: { xs: 260, sm: 320 },
          transformStyle: "preserve-3d",
          transition: "transform 480ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <Paper
          variant="outlined"
          aria-hidden={flipped}
          sx={{ ...faceStyles, bgcolor: "background.paper" }}
        >
          <Typography
            component="p"
            align="center"
            sx={{
              width: "100%",
              maxHeight: "100%",
              overflowY: "auto",

              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",

              fontSize: getCardFontSize(front),
              lineHeight: 1.25,
            }}
          >
            {front}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          aria-hidden={!flipped}
          sx={{
            ...faceStyles,
            transform: "rotateY(180deg)",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderColor: "primary.main",
          }}
        >
          <Typography
            component="p"
            align="center"
            sx={{
              width: "100%",
              maxHeight: "100%",
              overflowY: "auto",

              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",

              fontSize: getCardFontSize(back),
              lineHeight: 1.25,
            }}
          >
            {back}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
