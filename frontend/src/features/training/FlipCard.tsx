import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
import type { CardSide } from "../../types";

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
}) {
  const showEditor = visible && editing;

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
            helperText={fieldError ?? " "}
            disabled={saving}
            label={side === "front" ? "Front" : "Back"}
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
              {saveError}
            </Typography>
          )}
          <Stack direction="row" gap={1} justifyContent="flex-end">
            <Button color="inherit" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="contained" onClick={onSave} disabled={saving}>
              {saving ? <CircularProgress size={18} color="inherit" /> : "Save"}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <>
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
          {visible && (
            <IconButton
              aria-label={`Edit ${side}`}
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
        </>
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
  const flipped = side === "back";

  if (front == null || back == null) {
    return null;
  }

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
          : `Flashcard, showing the ${side}. Activate to flip.`
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
          {...faceProps}
        />
        <CardFace
          text={back}
          side="back"
          visible={flipped}
          colored
          {...faceProps}
        />
      </Box>
    </Box>
  );
}
