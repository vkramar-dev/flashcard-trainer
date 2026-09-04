import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import { Alert, Box, Button, Chip, Divider, IconButton, Paper, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { PageContainer } from "../components/PageContainer"
import { ErrorState, LoadingState } from "../components/StateViews"
import { clearSelectedSet, createSet, fetchSet, updateSet } from "../features/sets/setsSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import type { CardPayload } from "../types"

/** A card row held in local component state while editing. */
interface DraftCard {
  /** Stable key for React; not sent to the backend. */
  key: string
  /** Backend id, or null for a card that does not exist yet. */
  id: number | null
  front: string
  back: string
}

let keyCounter = 0
const nextKey = () => `draft-${(keyCounter += 1)}`

const emptyCard = (): DraftCard => ({ key: nextKey(), id: null, front: "", back: "" })

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
    if (setId !== null) dispatch(fetchSet(setId))
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
  const cardsError =
    filledCards.length === 0
      ? "Add at least one card."
      : filledCards.some((card) => !card.front.trim() || !card.back.trim())
        ? "Every card needs both a front and a back value."
        : null

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

  const handleSave = async () => {
    setShowErrors(true)
    if (nameError || cardsError) return

    const payload = {
      id: setId,
      name: name.trim(),
      cards: filledCards.map<CardPayload>((card) => ({
        id: card.id,
        front: card.front.trim(),
        back: card.back.trim(),
      })),
    }

    await dispatch(createSet(payload)).unwrap()
    navigate("/")
      // setId === null
      //   ? await dispatch(createSet(payload))
      //   : await dispatch(updateSet({ setId, payload }))

    // if (createSet.fulfilled.match(result) || updateSet.fulfilled.match(result)) {
    //   // Mark as saved so the navigation guard does not fire.
    //   savedRef.current = true
    //   baseline.current = snapshot(result.payload.name, cards)
    //   navigate("/")
    // }
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
        <ErrorState message={error ?? "Could not load this set."} onRetry={() => setId && dispatch(fetchSet(setId))} />
      </PageContainer>
    )
  }

  const saving = saveStatus === "loading"

  return (
    <PageContainer
      title={isNew ? "New set" : "Edit set"}
      description="Cards are only stored once you save. Empty rows are ignored."
      maxWidth="md"
      actions={
        <Stack direction="row" gap={1.5}>
          <Button color="inherit" onClick={requestLeave} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Stack>
      }
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
            <Button
              startIcon={<AddIcon />}
              onClick={() => setCards((current) => [...current, emptyCard()])}
              disabled={saving}
            >
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
                    error={showErrors && Boolean(card.back.trim()) && !card.front.trim()}
                    disabled={saving}
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
                  />
                  <TextField
                    label="Back"
                    value={card.back}
                    onChange={(event) => updateCard(card.key, { back: event.target.value })}
                    error={showErrors && Boolean(card.front.trim()) && !card.back.trim()}
                    disabled={saving}
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
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

          {showErrors && cardsError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {cardsError}
            </Alert>
          )}
        </Box>

        {saveError && <Alert severity="error">{saveError}</Alert>}
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
