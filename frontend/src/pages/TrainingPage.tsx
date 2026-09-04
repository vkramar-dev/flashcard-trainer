import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
//import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PageContainer } from "../components/PageContainer"
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews"
import { FlipCard } from "../features/training/FlipCard"
import {
  abandonTraining,
  flipCard,
  answer,
  startTraining,
} from "../features/training/trainingSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"

/**
 * Both answer buttons advance to the next card, so each is labelled "Next"
 * with the condition it records shown underneath in smaller text.
 */
const answerButtonStyles = {
  py: 1.25,
  px: 2.5,
  // Sized to their content rather than stretched across the card.
  minWidth: 168,
  // The icon is centred against the two-line label rather than the first line.
  "& .MuiButton-startIcon": { alignSelf: "center" },
}

const answerLabelStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  lineHeight: 1.2,
}

const answerHintStyles = {
  fontSize: "0.75rem",
  fontWeight: 400,
  opacity: 0.85,
  textTransform: "none",
}

export default function TrainingPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { setId: setIdParam } = useParams<{ setId: string }>()
  const setId = Number(setIdParam)

  const { currentCard, currentIndex, side, pendingAnswer, status, error, finished, cards } =
    useAppSelector((state) => state.training)

  const total = cards.length
  const position = currentIndex + 1
  const setName = useAppSelector((state) => state.sets.selectedSet?.name ?? "")

  if (status === "loading") {
    return (
      <PageContainer title="Training" maxWidth="sm">
        <LoadingState label="Preparing your cards..." />
      </PageContainer>
    )
  }

  if (status === "failed") {
    return (
      <PageContainer title="Training" maxWidth="sm">
        <ErrorState message={error ?? "Could not start training."} onRetry={() => dispatch(startTraining(setId))} />
        <Box sx={{ mt: 3 }}>
          <Button onClick={() => navigate("/")}>Back to sets</Button>
        </Box>
      </PageContainer>
    )
  }

  if (finished) {
    return (
      <PageContainer title="Training complete" maxWidth="sm">
        <EmptyState
          title={`You finished ${setName}`}
          description={`All ${total} card${total === 1 ? "" : "s"} in this set have been reviewed and your answers are saved.`}
          action={
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="center">
              <Button variant="contained" onClick={() => dispatch(startTraining(setId))}>
                Train again
              </Button>
              <Button onClick={() => navigate(`/statistics?setId=${setId}`)}>View statistics</Button>
              <Button color="inherit" onClick={() => navigate("/")}>
                Back to sets
              </Button>
            </Stack>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={setName || "Training"}
      description="Tap the card to reveal the other side, then choose whether you knew it to move on."
      maxWidth="sm"
      actions={
        <Button
          color="inherit"
          onClick={() => {
            dispatch(abandonTraining())
            navigate("/")
          }}
        >
          End session
        </Button>
      }
    >
      <Stack gap={3}>
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
              Card {position} of {total}
            </Typography>
            <Chip size="small" label={side === "front" ? "Front" : "Back"} />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (position / total) * 100 : 0}
            aria-label="Training progress"
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {currentCard ? (
          <FlipCard
            front={currentCard.front}
            back={currentCard.back}
            side={side}
            onFlip={() => dispatch(flipCard())}
          />
        ) : (
          <Paper
            variant="outlined"
            sx={{
              height: { xs: 260, sm: 320 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Paper>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={1.5}
            sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "center" }}
            role="group"
            aria-label="Did you know this card? Either answer saves your result and moves to the next card."
          >
            <Button
              variant="contained"
              color="warning"
              startIcon={<HelpOutlineIcon />}
              onClick={() => dispatch(answer({ cardId: currentCard.id, isKnown: false }))}
              disabled={!currentCard}
              sx={answerButtonStyles}
            >
              {pendingAnswer === false ? (
                "Saving..."
              ) : (
                <Box component="span" sx={answerLabelStyles}>
                  <Box component="span" sx={{ fontSize: "1rem", fontWeight: 600 }}>
                    Next
                  </Box>
                  <Box component="span" sx={answerHintStyles}>
                    {"I don't know this"}
                  </Box>
                </Box>
              )}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => dispatch(answer({ cardId: currentCard.id, isKnown: true }))}
              disabled={!currentCard}
              sx={answerButtonStyles}
            >
              {pendingAnswer === true ? (
                "Saving..."
              ) : (
                <Box component="span" sx={answerLabelStyles}>
                  <Box component="span" sx={{ fontSize: "1rem", fontWeight: 600 }}>
                    Next
                  </Box>
                  <Box component="span" sx={answerHintStyles}>
                    I know this
                  </Box>
                </Box>
              )}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </PageContainer>
  )
}
