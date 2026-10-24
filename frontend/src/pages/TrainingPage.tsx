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
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { text } from "../i18n";
import { PageContainer } from "../components/PageContainer";
import { ErrorState } from "../components/StateViews";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import { alpha } from "@mui/material/styles";
import { FlipCard } from "../features/training/FlipCard";
import {
  flipCard,
  answerAsync,
  beginRepeatRound,
  resetTraining,
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
    if (!front) return "edit.frontRequired";
    if (front.length > ProjectConstants.cardFrontMaxLength) return "edit.frontTooLong";
    if (otherFronts.includes(front)) return "edit.duplicateFront";
    return null;
  }

  if (value.length > ProjectConstants.cardBackMaxLength) return "edit.backTooLong";
  return null;
}

const answerHintStyles = {
  fontSize: "0.75rem",
  fontWeight: 400,
  opacity: 0.85,
  textTransform: "none",
};

export default function TrainingPage() {
  const { t } = useTranslation();
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
    mistakeIds,
    mode,
  } = useAppSelector((state) => state.training);
  const hideKnownCards = useAppSelector((state) => state.settings.hideKnownCards);

  const total = cards.length;
  const mistakeCount = mistakeIds.length;
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
          : "errors.saveCard",
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
    } catch {
      // answerAsync already keeps the error in Redux state
    }
  };

  if (!userName) return null;

  if (!Number.isFinite(setId) || setId <= 0) {
    return (
      <PageContainer title={t("training.title")} maxWidth="sm">
        <ErrorState message="training.invalidLink" />
        <Box sx={{ mt: 3 }}>
          <Button onClick={() => navigate("/")}>{t("common.backToSets")}</Button>
        </Box>
      </PageContainer>
    );
  }

  if (status === "failed") {
    return (
      <PageContainer title={t("training.title")} maxWidth="sm">
        <ErrorState message={error ?? "training.couldNotStart"} />
        <Box sx={{ mt: 3 }}>
          <Button onClick={() => navigate("/")}>{t("common.backToSets")}</Button>
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
            {t("training.complete")}
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
            {setName || t("training.fallbackSet")}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              maxWidth: 460,
              lineHeight: 1.6,
            }}
          >
            {t("training.reviewed", { count: total })}
          </Typography>

          {mistakeCount > 0 && (
            <Stack spacing={1.5} alignItems="center" sx={{ pt: 0.5 }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <ReplayIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography sx={{ color: "primary.main", fontWeight: 500 }}>
                  {t("training.mistakes", { count: mistakeCount })}
                </Typography>
              </Stack>
              <Button
                variant="contained"
                size="large"
                startIcon={<ReplayIcon />}
                onClick={() => {
                  void dispatch(beginRepeatRound());
                }}
              >
                {t("training.repeatMistakes", { count: mistakeCount })}
              </Button>
            </Stack>
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="center"
            sx={{ pt: mistakeCount > 0 ? 2 : 1.5 }}
          >
            <Button
              variant={mistakeCount > 0 ? "outlined" : "contained"}
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
              {t("training.trainAgain")}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(`/statistics?setId=${setId}`)}
            >
              {t("training.viewStatistics")}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                AppStorage.clearTrainingProgress();
                dispatch(fetchSetsAsync());
                navigate("/");
              }}
            >
              {t("common.backToSets")}
            </Button>
          </Stack>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={setName || t("training.title")}
      description={t("training.description")}
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
            if (mode === "repeat") dispatch(resetTraining());
          }}
        >
          {t("training.endSession")}
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
              {t("training.cardPosition", { position, total })}
            </Typography>
            <Chip size="small" label={side === "front" ? t("common.front") : t("common.backSide")} />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (position / total) * 100 : 0}
            aria-label={t("training.progress")}
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

        {error && <Alert severity="error">{text(error)}</Alert>}

        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={1.5}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "center",
            }}
            role="group"
            aria-label={t("training.answerGroup")}
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
                  {t("common.next")}
                </Box>
                <Box component="span" sx={answerHintStyles}>
                  {t("training.dontKnow")}
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
                  {t("common.next")}
                </Box>
                <Box component="span" sx={answerHintStyles}>
                  {t("training.know")}
                </Box>
              </Box>
            </Button>
          </Stack>
        </Box>
      </Stack>
    </PageContainer>
  );
}
