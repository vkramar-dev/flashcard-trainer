import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
} from "@mui/material";

import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";
import { EmptyState, ErrorState } from "../components/StateViews";
import { FlipCard } from "../features/training/FlipCard";
import {
  flipCard,
  answerAsync,
  startTrainingAsync,
} from "../features/training/trainingSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AppStorage } from "@/utils/AppStorage";

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
};

const answerLabelStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  lineHeight: 1.2,
};

const answerHintStyles = {
  fontSize: "0.75rem",
  fontWeight: 400,
  opacity: 0.85,
  textTransform: "none",
};

export default function TrainingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { setId: setIdParam } = useParams<{ setId: string }>();
  const setId = Number(setIdParam);

  const {
    currentCard,
    currentIndex,
    side,
    status,
    error,
    finished,
    cards,
  } = useAppSelector((state) => state.training);
  const { hideKnownCards } = useAppSelector((state) => state.settings);

  const total = cards.length;
  const position = currentIndex + 1;
  const setName = useAppSelector((state) => {
    const listed = state.sets.items.find((set) => set.id === setId);
    if (listed) return listed.name;
    return state.sets.selectedSet?.id === setId
      ? state.sets.selectedSet.name
      : "";
  });

  const userName = useAppSelector((state) => state.auth.user?.email);

  const handleAnswer = async (isKnown: boolean) => {
    if (!currentCard || !userName) return;

    try {
      await dispatch(
        answerAsync({
          cardId: currentCard.id,
          isKnown,
        }),
      ).unwrap();

      const nextIndex = currentIndex + 1;

      if (nextIndex >= cards.length) {
        AppStorage.clearTrainingProgress();
      } else {
        AppStorage.setTrainingProgressNoException({
          userName,
          setId,
          cards,
          currentIndex: nextIndex,
        });
      }
    } catch {
      // answerAsync already keeps the error in Redux state
    }
  };

  if (!userName) return null;

  if (status === "failed") {
    return (
      <PageContainer title="Training" maxWidth="sm">
        <ErrorState message={error ?? "Could not start training."} />
        <Box sx={{ mt: 3 }}>
          <Button onClick={() => navigate("/")}>Back to sets</Button>
        </Box>
      </PageContainer>
    );
  }

  if (finished) {
    return (
      <PageContainer title="Training complete" maxWidth="sm">
        <EmptyState
          title={setName ? `You finished ${setName}` : "You finished the set"}
          description={`All ${total} card${total === 1 ? "" : "s"} in this set have been reviewed and your answers are saved.`}
          action={
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1.5}
              justifyContent="center"
            >
              <Button
                variant="contained"
                onClick={() =>
                  dispatch(
                    startTrainingAsync({
                      userName,
                      setId,
                      shouldHide: hideKnownCards,
                    }),
                  ).unwrap()
                }
              >
                Train again
              </Button>
              <Button onClick={() => navigate(`/statistics?setId=${setId}`)}>
                View statistics
              </Button>
              <Button color="inherit" onClick={() => navigate("/")}>
                Back to sets
              </Button>
            </Stack>
          }
        />
      </PageContainer>
    );
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
            AppStorage.clearTrainingProgress()
            navigate("/");
          }}
        >
          End session
        </Button>
      }
    >
      <Stack gap={3}>
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
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
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "center",
            }}
            role="group"
            aria-label="Did you know this card? Either answer saves your result and moves to the next card."
          >
            <Button
              variant="contained"
              color="warning"
              startIcon={<HelpOutlineIcon />}
              onClick={() => handleAnswer(false)}
              disabled={!currentCard || status === "loading"}
              sx={answerButtonStyles}
            >
              <Box component="span" sx={answerLabelStyles}>
                <Box
                  component="span"
                  sx={{ fontSize: "1rem", fontWeight: 600 }}
                >
                  Next
                </Box>
                <Box component="span" sx={answerHintStyles}>
                  {"I don't know this"}
                </Box>
              </Box>
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => handleAnswer(true)}
              disabled={!currentCard || status === "loading"}
              sx={answerButtonStyles}
            >
              <Box component="span" sx={answerLabelStyles}>
                <Box
                  component="span"
                  sx={{ fontSize: "1rem", fontWeight: 600 }}
                >
                  Next
                </Box>
                <Box component="span" sx={answerHintStyles}>
                  I know this
                </Box>
              </Box>
            </Button>
          </Stack>
        </Box>
      </Stack>
    </PageContainer>
  );
}
