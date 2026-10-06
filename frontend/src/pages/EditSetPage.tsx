import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import { Alert, Box, Button, Chip, Divider, IconButton, Paper, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { PageContainer } from "../components/PageContainer"
import { ErrorState, LoadingState } from "../components/StateViews"
import { clearSelectedSet, createSetAsync, fetchSetAsync } from "../features/sets/setsSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import type { CardModel } from "../types"

/** A card row held in local component state while editing. */
interface DraftCard {
  /** Stable key for React; not sent to the backend. */
  key: string
  /** Backend id, or null for a card that does not exist yet. */
  id: number | null
  front: string
  back: string
}

const CARD_FRONT_MAX_LENGTH = 300
const CARD_BACK_MAX_LENGTH = 500

let keyCounter = 0
const nextKey = () => `draft-${(keyCounter += 1)}`

const emptyCard = (): DraftCard => ({ key: nextKey(), id: null, front: "", back: "" })

function frontFieldError(card: DraftCard): string | null {
  const front = card.front.trim()
  const back = card.back.trim()
  if (!front && !back) return null
  if (!front) return "Enter a front value."
  if (front.length > CARD_FRONT_MAX_LENGTH) {
    return `Front text cannot be longer than ${CARD_FRONT_MAX_LENGTH} characters.`
  }
  return null
}

function backFieldError(card: DraftCard): string | null {
  const back = card.back.trim()
  if (back.length > CARD_BACK_MAX_LENGTH) {
    return `Back text cannot be longer than ${CARD_BACK_MAX_LENGTH} characters.`
  }
  return null
}

function cardListError(cards: DraftCard[]): string | null {
  if (cards.some((card) => !card.front.trim())) return "Every card needs a front value."
  if (cards.some((card) => card.front.trim().length > CARD_FRONT_MAX_LENGTH)) {
    return `Front text cannot be longer than ${CARD_FRONT_MAX_LENGTH} characters.`
  }
  if (cards.some((card) => card.back.trim().length > CARD_BACK_MAX_LENGTH)) {
    return `Back text cannot be longer than ${CARD_BACK_MAX_LENGTH} characters.`
  }
  return null
}

export default function EditSetPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { setId: setIdParam } = useParams<{ setId: string }>()
  const setId = setIdParam ? Number(setIdParam) : null
  const isNew = setId === null

  const { selectedSet, status, error, saveStatus, saveError } = useAppSelector((state) => state.sets)

  const [name, setName] = useState("")
  const [cards, setCards] = useState<DraftCard[]>([emptyCard()])
  const [showErrors, setShowErrors] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  /** Snapshot of the loaded state, used to detect unsaved changes. */
  const baseline = useRef<string>("")
  const savedRef = useRef(false)

  const snapshot = (currentName: string, currentCards: DraftCard[]) =>
    JSON.stringify({
      name: currentName.trim(),
      cards: currentCards.map((card) => ({ id: card.id, front: card.front.trim(), back: card.back.trim() })),
    })

  // Load the set being edited, and reset local state when leaving the page.
  useEffect(() => {
    if (setId !== null) dispatch(fetchSetAsync(setId))
    return () => {
      dispatch(clearSelectedSet())
    }
  }, [dispatch, setId])

  // Seed the form once the set detail arrives.
  useEffect(() => {
    if (isNew) {
      baseline.current = snapshot("", [emptyCard()])
      return
    }
    if (selectedSet && selectedSet.id === setId) {
      const loaded: DraftCard[] =
        selectedSet.cards.length > 0
          ? selectedSet.cards.map((card) => ({ key: nextKey(), id: card.id, front: card.front, back: card.back }))
          : [emptyCard()]
      setName(selectedSet.name)
      setCards(loaded)
      baseline.current = snapshot(selectedSet.name, loaded)
    }
  }, [isNew, selectedSet, setId])

  const isDirty = snapshot(name, cards) !== baseline.current

  // Warn on browser refresh or tab close while there are unsaved changes.
  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  const filledCards = useMemo(
    () => cards.filter((card) => card.front.trim().length > 0 || card.back.trim().length > 0),
    [cards],
  )

  const nameError = name.trim().length === 0 ? "Please enter a name for this set." : null
  const cardsError = cardListError(filledCards)

  const updateCard = (key: string, patch: Partial<Pick<DraftCard, "front" | "back">>) => {
    setCards((current) => current.map((card) => (card.key === key ? { ...card, ...patch } : card)))
  }

  const removeCard = (key: string) => {
    setCards((current) => {
      const next = current.filter((card) => card.key !== key)
      // Always leave one editable row behind.
      return next.length > 0 ? next : [emptyCard()]
    })
  }

  const addCard = () => setCards((current) => [...current, emptyCard()])

  const handleSave = async () => {
    setShowErrors(true)
    if (nameError || cardsError) return

    const payload = {
      id: setId,
      name: name.trim(),
      cards: filledCards.map<CardModel>((card) => ({
        id: card.id,
        front: card.front.trim(),
        back: card.back.trim(),
      })),
    }

    await dispatch(createSetAsync(payload)).unwrap()
    navigate("/")
  }

  const requestLeave = () => {
    if (isDirty && !savedRef.current) {
      setLeaveConfirmOpen(true)
      return
    }
    navigate("/")
  }

  if (!isNew && status === "loading" && !selectedSet) {
    return (
      <PageContainer title="Edit set" maxWidth="md">
        <LoadingState label="Loading this set..." />
      </PageContainer>
    )
  }

  if (!isNew && status === "failed" && !selectedSet) {
    return (
      <PageContainer title="Edit set" maxWidth="md">
        <ErrorState message={error ?? "Could not load this set."} onRetry={() => setId && dispatch(fetchSetAsync(setId))} />
      </PageContainer>
    )
  }

  const saving = saveStatus === "loading"

  const formActions = (
    <Stack direction="row" gap={1.5}>
      <Button color="inherit" onClick={requestLeave} disabled={saving}>
        Cancel
      </Button>
      <Button variant="contained" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </Stack>
  )

  return (
    <PageContainer
      title={isNew ? "New set" : "Edit set"}
      description="Cards are only stored once you save. Empty rows are ignored."
      maxWidth="md"
      actions={formActions}
    >
      <Stack gap={3}>
        <TextField
          label="Set name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={showErrors && Boolean(nameError)}
          helperText={showErrors && nameError ? nameError : " "}
          disabled={saving}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 120 } }}
        />

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Typography variant="h6" component="h2">
                Cards
              </Typography>
              <Chip label={filledCards.length} size="small" />
            </Stack>
            <Button startIcon={<AddIcon />} onClick={addCard} disabled={saving}>
              Add card
            </Button>
          </Stack>

          <Paper variant="outlined">
            <Stack divider={<Divider />}>
              {cards.map((card, index) => (
                <Stack
                  key={card.key}
                  direction={{ xs: "column", sm: "row" }}
                  gap={2}
                  alignItems={{ xs: "stretch", sm: "flex-start" }}
                  sx={{ p: 2 }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ pt: { sm: 2 }, minWidth: 24, fontVariantNumeric: "tabular-nums" }}
                  >
                    {index + 1}
                  </Typography>
                  <TextField
                    label="Front"
                    value={card.front}
                    onChange={(event) => updateCard(card.key, { front: event.target.value })}
                    error={showErrors && Boolean(frontFieldError(card))}
                    helperText={showErrors ? frontFieldError(card) ?? undefined : undefined}
                    disabled={saving}
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
                    slotProps={{ htmlInput: { maxLength: CARD_FRONT_MAX_LENGTH } }}
                  />
                  <TextField
                    label="Back"
                    value={card.back}
                    onChange={(event) => updateCard(card.key, { back: event.target.value })}
                    error={showErrors && Boolean(backFieldError(card))}
                    helperText={showErrors ? backFieldError(card) ?? undefined : undefined}
                    disabled={saving}
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
                    slotProps={{ htmlInput: { maxLength: CARD_BACK_MAX_LENGTH } }}
                  />
                  <IconButton
                    aria-label={`Remove card ${index + 1}`}
                    onClick={() => removeCard(card.key)}
                    disabled={saving}
                    sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <Button startIcon={<AddIcon />} onClick={addCard} disabled={saving}>
              Add card
            </Button>
          </Stack>

          {showErrors && cardsError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {cardsError}
            </Alert>
          )}
        </Box>

        {saveError && <Alert severity="error">{saveError}</Alert>}

        <Stack direction="row" justifyContent="flex-end">
          {formActions}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="Discard unsaved changes?"
        description="You have edits on this set that have not been saved yet. Leaving now discards them."
        confirmLabel="Discard"
        destructive
        onCancel={() => setLeaveConfirmOpen(false)}
        onConfirm={() => {
          setLeaveConfirmOpen(false)
          navigate("/")
        }}
      />
    </PageContainer>
  )
}
