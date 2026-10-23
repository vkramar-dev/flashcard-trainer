import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { text as translate } from "../../i18n";
import type { CardSide } from "../../types";
import { ProjectConstants } from "../../utils/ProjectConstants";

const MAX_HINT_CHARACTERS = 3;

/** Code points, so a UTF-16 surrogate pair stays one character. */
function codePoints(text: string): string[] {
  return Array.from(text);
}

function hintPreview(characters: string[], revealed: number): string {
  if (revealed <= 0) return "";
  const prefix = characters.slice(0, revealed).join("");
  return revealed < characters.length ? `${prefix}...` : prefix;
}

interface LetterHint {
  preview: string;
  revealed: number;
  limit: number;
  onReveal: () => void;
}

interface FlipCardProps {
  front: string;
  back: string;
  side: CardSide;
  editing: boolean;
  draft: string;
  fieldError: string | null;
  saveError: string | null;
  saving: boolean;
  onFlip: () => void;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
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

function CardFace({
  text,
  side,
  visible,
  colored,
  editing,
  draft,
  fieldError,
  saveError,
  saving,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
  letterHint,
}: {
  text: string;
  side: CardSide;
  visible: boolean;
  colored: boolean;
  editing: boolean;
  draft: string;
  fieldError: string | null;
  saveError: string | null;
  saving: boolean;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  letterHint: LetterHint | null;
}) {
  const { t } = useTranslation();
  const showEditor = visible && editing;
  const showHint = letterHint != null && !showEditor;
  const hintExhausted = showHint && letterHint.revealed >= letterHint.limit;
  const hintLabel =
    !showHint || letterHint.revealed === 0
      ? t("hint.hint")
      : hintExhausted
        ? t("hint.progress", { revealed: letterHint.revealed, limit: letterHint.limit })
        : t("hint.nextLetter");

  return (
    <Paper
      variant="outlined"
      aria-hidden={!visible}
      sx={{
        ...faceStyles,
        ...(colored
          ? {
              transform: "rotateY(180deg)",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderColor: "primary.main",
            }
          : { bgcolor: "background.paper" }),
        ...(showEditor
          ? {
              alignItems: "stretch",
              justifyContent: "flex-start",
              bgcolor: "background.paper",
              color: "text.primary",
              borderColor: "divider",
            }
          : {}),
        ...(showHint
          ? {
              flexDirection: "column",
              alignItems: "stretch",
              justifyContent: "flex-start",
              overflow: "hidden",
            }
          : {}),
      }}
    >
      {showEditor ? (
        <Stack
          gap={1.5}
          sx={{ width: "100%", height: "100%" }}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <TextField
            autoFocus
            multiline
            minRows={4}
            fullWidth
            value={draft}
            error={Boolean(fieldError)}
            helperText={
              fieldError
                ? translate(fieldError, {
                    max:
                      side === "front"
                        ? ProjectConstants.cardFrontMaxLength
                        : ProjectConstants.cardBackMaxLength,
                  })
                : " "
            }
            disabled={saving}
            label={side === "front" ? t("common.front") : t("common.backSide")}
            onChange={(event) => onDraftChange(event.target.value)}
            sx={{
              flex: 1,
              "& .MuiInputBase-root": {
                height: "100%",
                alignItems: "flex-start",
              },
              "& .MuiInputBase-input": {
                height: "100% !important",
                overflow: "auto !important",
              },
            }}
          />
          {saveError && (
            <Typography variant="body2" color={colored ? "inherit" : "error"}>
              {translate(saveError)}
            </Typography>
          )}
          <Stack direction="row" gap={1} justifyContent="flex-end">
            <Button color="inherit" onClick={onCancel} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button variant="contained" onClick={onSave} disabled={saving}>
              {saving ? <CircularProgress size={18} color="inherit" /> : t("common.save")}
            </Button>
          </Stack>
        </Stack>
      ) : showHint && letterHint ? (
        <>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              width: "100%",
              overflowY: "auto",
              display: "flex",
              alignItems: "safe center",
              justifyContent: "safe center",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Typography
                component="p"
                align="center"
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  fontSize: getCardFontSize(text),
                  lineHeight: 1.25,
                }}
              >
                {text}
              </Typography>
              <Typography
                component="p"
                align="center"
                aria-live="polite"
                sx={{
                  mt: 1.5,
                  minHeight: "1.4em",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: "primary.main",
                }}
              >
                {letterHint.preview}
              </Typography>
            </Box>
          </Box>
          {visible && (
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              sx={{ flexShrink: 0, pt: 1 }}
            >
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <Button
                    type="button"
                    size="small"
                    variant="outlined"
                    color="inherit"
                    disabled={hintExhausted}
                    startIcon={<LightbulbOutlinedIcon sx={{ fontSize: 16 }} />}
                    aria-label={
                      letterHint.revealed === 0
                        ? t("hint.first")
                        : hintExhausted
                          ? t("hint.done", {
                              revealed: letterHint.revealed,
                              limit: letterHint.limit,
                            })
                          : t("hint.next")
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      letterHint.onReveal();
                    }}
                    sx={{
                      px: 1.5,
                      py: 0.25,
                      minWidth: 0,
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      lineHeight: 1.4,
                      color: "text.secondary",
                      borderColor: "divider",
                      "& .MuiButton-startIcon": { mr: 0.75, ml: 0 },
                    }}
                  >
                    {hintLabel}
                  </Button>
                </Box>
                {letterHint.revealed > 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      position: "absolute",
                      left: "100%",
                      ml: 1.25,
                      top: "50%",
                      transform: "translateY(-50%)",
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {t("hint.progress", {
                      revealed: letterHint.revealed,
                      limit: letterHint.limit,
                    })}
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </>
      ) : (
        <Typography
          component="p"
          align="center"
          sx={{
            width: "100%",
            maxHeight: "100%",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            fontSize: getCardFontSize(text),
            lineHeight: 1.25,
          }}
        >
          {text}
        </Typography>
      )}
      {visible && !showEditor && (
        <IconButton
          aria-label={t("training.editSide", {
            side: t(side === "front" ? "training.sideFront" : "training.sideBack"),
          })}
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onStartEdit();
          }}
          sx={{ position: "absolute", top: 8, right: 8, color: "inherit" }}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );
}

/** A flashcard that rotates in 3D between its front and back side when activated. */
export function FlipCard({
  front,
  back,
  side,
  editing,
  draft,
  fieldError,
  saveError,
  saving,
  onFlip,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
}: FlipCardProps) {
  const { t } = useTranslation();
  const flipped = side === "back";
  const [revealed, setRevealed] = useState(0);
  const [hintBack, setHintBack] = useState(back);

  if (front == null || back == null) {
    return null;
  }

  // A new answer, including an edit of this card, starts with no letters revealed.
  if (back !== hintBack) {
    setHintBack(back);
    setRevealed(0);
  }

  const answerCharacters = codePoints(back);
  const hintLimit = Math.min(MAX_HINT_CHARACTERS, answerCharacters.length);
  const shown = back === hintBack ? Math.min(revealed, hintLimit) : 0;
  const letterHint: LetterHint | null =
    hintLimit > 0
      ? {
          preview: hintPreview(answerCharacters, shown),
          revealed: shown,
          limit: hintLimit,
          onReveal: () => setRevealed((count) => Math.min(hintLimit, count + 1)),
        }
      : null;

  const faceProps = {
    editing,
    draft,
    fieldError,
    saveError,
    saving,
    onDraftChange,
    onStartEdit,
    onSave,
    onCancel,
  };

  return (
    <Box
      role={editing ? undefined : "button"}
      tabIndex={editing ? undefined : 0}
      aria-label={
        editing
          ? undefined
          : t("training.flashcardLabel", {
              side: t(side === "front" ? "training.sideFront" : "training.sideBack"),
            })
      }
      onClick={() => {
        if (!editing) onFlip();
      }}
      onKeyDown={(event) => {
        if (editing) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
      sx={{
        perspective: "1600px",
        cursor: editing ? "default" : "pointer",
        outline: "none",
        borderRadius: 3,

        "@keyframes cardEnter": {
          from: {
            opacity: 0,
            transform: "translateY(8px)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },

        animation: "cardEnter 350ms ease-out",

        "&:focus-visible": {
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}55`,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: { xs: editing ? 340 : 260, sm: editing ? 380 : 320 },
          transformStyle: "preserve-3d",
          transition: editing
            ? "none"
            : "transform 480ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <CardFace
          text={front}
          side="front"
          visible={!flipped}
          colored={false}
          letterHint={flipped ? null : letterHint}
          {...faceProps}
        />
        <CardFace
          text={back}
          side="back"
          visible={flipped}
          colored
          letterHint={null}
          {...faceProps}
        />
      </Box>
    </Box>
  );
}
