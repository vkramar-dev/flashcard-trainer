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

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";
import { ErrorState } from "../components/StateViews";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { alpha } from "@mui/material/styles";
import { FlipCard } from "../features/training/FlipCard";
import {
  flipCard,
  answerAsync,
  restoreState,
  startTrainingAsync,
  updateTrainingCardAsync,
} from "../features/training/trainingSlice";
import { ProjectConstants } from "../utils/ProjectConstants";
import type { CardSide } from "../types";
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

function sideTextError(side: CardSide, value: string, otherFronts: string[]): string | null {
  if (side === "front") {
    const front = value.trim();
    if (!front) return "Enter a front value.";
    if (front.length > ProjectConstants.cardFrontMaxLength) {
      return `Front text cannot be longer than ${ProjectConstants.cardFrontMaxLength} characters.`;
    }
    if (otherFronts.includes(front)) return "A card with this front already exists in this set.";
    return null;
  }

  if (value.length > ProjectConstants.cardBackMaxLength) {
    return `Back text cannot be longer than ${ProjectConstants.cardBackMaxLength} characters.`;
  }
  return null;
}

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
  const hideKnownCards = useAppSelector((state) => state.settings.hideKnownCards);

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

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const closeEditor = () => {
    setEditing(false);
    setFieldError(null);
    setSaveError(null);
  };

  const startEdit = () => {
    if (!currentCard || saving) return;
    setDraft(side === "front" ? currentCard.front : currentCard.back);
    setFieldError(null);
    setSaveError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!currentCard || saving) return;
    const original = side === "front" ? currentCard.front : currentCard.back;
    const nextText = side === "front" ? draft.trim() : draft.trim();
    const otherFronts = cards
      .filter((card) => card.id !== currentCard.id)
      .map((card) => card.front);
    const validationError = sideTextError(side, nextText, otherFronts);
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    if (nextText === original) {
      closeEditor();
      return;
    }

    setSaving(true);
    setFieldError(null);
    setSaveError(null);
    try {
      await dispatch(
        updateTrainingCardAsync({
          cardId: currentCard.id,
          side,
          text: nextText,
        }),
      ).unwrap();
      closeEditor();
    } catch (saveFailure) {
      setSaveError(
        typeof saveFailure === "string"
          ? saveFailure
          : "Could not save this card.",
      );
    } finally {
      setSaving(false);
    }
  };

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
    if (!currentCard || !userName || editing || saving) return;

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
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            }}
          >
            <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 36 }} />
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
              onClick={() => navigate(`/statistics?setId=${setId}`)}
            >
              View statistics
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                dispatch(fetchSetsAsync());
                navigate("/");
              }}
            >
              Back to sets
            </Button>
          </Stack>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={setName || "Training"}
      description="Tap to flip, then choose if you knew the answer."
      maxWidth="sm"
      actions={
        <Button
          color="inherit"
          sx={{
            transform: "translateY(-12px)",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
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
            key={currentCard.id}
            front={currentCard.front}
            back={currentCard.back}
            side={side}
            editing={editing}
            draft={draft}
            fieldError={fieldError}
            saveError={saveError}
            saving={saving}
            onFlip={() => {
              if (!editing) dispatch(flipCard());
            }}
            onDraftChange={(value) => {
              setDraft(value);
              setFieldError(null);
            }}
            onStartEdit={startEdit}
            onSave={() => void saveEdit()}
            onCancel={closeEditor}
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
              disabled={!currentCard || status === "loading" || editing || saving}
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
              disabled={!currentCard || status === "loading" || editing || saving}
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
