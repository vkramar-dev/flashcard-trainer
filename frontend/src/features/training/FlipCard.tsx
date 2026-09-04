import { Box, Paper, Typography } from "@mui/material"
import type { CardSide } from "../../types"

interface FlipCardProps {
  front: string
  back: string
  side: CardSide
  onFlip: () => void
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
} as const

/** A flashcard that rotates in 3D between its front and back side when activated. */
export function FlipCard({ front, back, side, onFlip }: FlipCardProps) {
  const flipped = side === "back"
console.log(`Flipped: ${flipped}, Side: ${side}`)
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Flashcard, showing the ${side}. Activate to flip.`}
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onFlip()
        }
      }}
      sx={{
        perspective: "1600px",
        cursor: "pointer",
        outline: "none",
        borderRadius: 3,
        "&:focus-visible": { boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}55` },
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
          <Typography variant="h4" component="p" align="center" sx={{ overflowWrap: "anywhere" }}>
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
          <Typography variant="h4" component="p" align="center" sx={{ overflowWrap: "anywhere" }}>
            {back}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
