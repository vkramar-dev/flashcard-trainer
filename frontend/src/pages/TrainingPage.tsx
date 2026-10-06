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

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";
import { ErrorState } from "../components/StateViews";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import { alpha } from "@mui/material/styles"
import { FlipCard } from "../features/training/FlipCard";
import {
  flipCard,
  answerAsync,
  restoreState,
  startTrainingAsync,
} from "../features/training/trainingSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AppStorage } from "@/utils/AppStorage";
import { fetchSetsAsync } from "@/features/sets/setsSlice";

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
    setId: trainingSetId,
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

  useEffect(() => {
    if (!userName || !Number.isFinite(setId) || setId <= 0) return;
    if (status === "loading") return;
    if (trainingSetId === setId && (status === "failed" || finished)) return;
    if (cards.length > 0 && trainingSetId === setId && currentCard) return;

    const saved = AppStorage.getTrainingProgress();
    if (
      saved &&
      saved.userName === userName &&
      saved.setId === setId &&
      saved.cards.length > 0
    ) {
      dispatch(restoreState(saved));
      return;
    }

    void dispatch(
      startTrainingAsync({
        userName,
        setId,
        shouldHide: hideKnownCards,
      }),
    );
  }, [
    cards.length,
    currentCard,
    dispatch,
    finished,
    hideKnownCards,
    setId,
    status,
    trainingSetId,
    userName,
  ]);

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

  if (!Number.isFinite(setId) || setId <= 0) {
    return (
      <PageContainer title="Training" maxWidth="sm">
        <ErrorState message="This training link is not valid." />
        <Box sx={{ mt: 3 }}>
          <Button onClick={() => navigate("/")}>Back to sets</Button>
        </Box>
      </PageContainer>
    );
  }

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
    <PageContainer maxWidth="sm">
      <Stack
        spacing={2}
        alignItems="center"
        textAlign="center"
        sx={{
          minHeight: { xs: 480, md: 560 },
          justifyContent: "center",

          // Move the whole completion block slightly upward
          transform: {
            xs: "translateY(-20px)",
            md: "translateY(-40px)",
          },
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, 0.12),
          }}
        >
          <CheckCircleOutlineIcon
            color="primary"
            sx={{ fontSize: 36 }}
          />
        </Box>

        <Typography
          component="h1"
          sx={{
            fontWeight: 750,
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
            fontSize: {
              xs: "1.65rem",
              md: "1.9rem",
            },
          }}
        >
          Training complete
        </Typography>

        <Typography
          sx={{
            fontSize: {
              xs: "1.35rem",
              md: "1.55rem",
            },
            fontWeight: 750,
          }}
        >
          {setName || "Training set"}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            maxWidth: 460,
            lineHeight: 1.6,
          }}
        >
          All {total} card{total === 1 ? "" : "s"} in this set have been
          reviewed and your answers are saved.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="center"
          sx={{ pt: 1.5 }}
        >
          <Button
            variant="contained"
            size="large"
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

          <Button
            variant="outlined"
            size="large"
            onClick={() =>
              navigate(`/statistics?setId=${setId}`)
            }
          >
            View statistics
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              dispatch(fetchSetsAsync())
              navigate("/")
            }}
          >
            Back to sets
          </Button>
        </Stack>
      </Stack>
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
            AppStorage.clearTrainingProgress();
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
