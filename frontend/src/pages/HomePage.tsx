import AddIcon from "@mui/icons-material/Add"
import { Box, Button, Snackbar, Alert } from "@mui/material"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { PageContainer } from "../components/PageContainer"
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews"
import { SignedOutNotice } from "../features/auth/SignedOutNotice"
import { ImportDialog } from "../features/sets/ImportDialog"
import { SetTile, type SetTileAction } from "../features/sets/SetTile"
import {
  clearSetsNotice,
  closeImportDialog,
  exportSet,
  fetchSets,
  importCards,
  openImportDialog,
  removeSet,
  toggleShuffle,
} from "../features/sets/setsSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import type { ImportMode, SetSummary } from "../types"
import { downloadCsv, toCardsCsv, toCsvFileName, type CsvCard } from "../utils/csv"
import { startTraining } from "@/features/training/trainingSlice"

export default function HomePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, status, error, saveStatus, saveError, importSetId, notice } = useAppSelector((state) => state.sets)
  const { isAuthenticated, sessionChecked } = useAppSelector((state) => state.auth)
  const [pendingRemoval, setPendingRemoval] = useState<SetSummary | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    dispatch(fetchSets())
  }, [dispatch, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <PageContainer
        title="Your sets"
        description="Flashcard sets belong to an account, so there is nothing to show until you sign in."
      >
        {sessionChecked ? (
          <SignedOutNotice
            title="Sign in to see your sets"
            description="Your flashcard sets, their cards and your learning progress are all stored with your account. Sign in to open them, or create an account to start your first set."
            highlights={[
              "Create sets and add cards, or import them from a CSV file",
              "Train with flip cards and keep track of what you have learnt",
              "Pick up where you left off from any device",
            ]}
          />
        ) : (
          <LoadingState label="Checking your session..." />
        )}
      </PageContainer>
    )
  }

  const importTarget = items.find((item) => item.id === importSetId) ?? null

  const handleExport = async (set: SetSummary) => {
    const result = await dispatch(exportSet(set.id))
    if (exportSet.fulfilled.match(result)) {
      downloadCsv(toCsvFileName(result.payload.name), toCardsCsv(result.payload.cards))
    }
  }

  const handleAction = (action: SetTileAction, set: SetSummary) => {
    switch (action) {
      case "start":
        dispatch(startTraining(set.id)).unwrap()
        navigate(`/set/${set.id}/train`)
        break
      case "edit":
        navigate(`/set/${set.id}/edit`)
        break
      case "import":
        dispatch(openImportDialog(set.id))
        break
      case "export":
        void handleExport(set)
        break
      case "statistics":
        navigate(`/statistics?setId=${set.id}`)
        break
      case "remove":
        setPendingRemoval(set)
        break
    }
  }

  const handleImport = (mode: ImportMode, cards: CsvCard[]) => {
    if (importSetId === null) return
    dispatch(importCards({ setId: importSetId, mode, cards }))
  }

  const confirmRemoval = async () => {
    if (!pendingRemoval) return
    const result = await dispatch(removeSet(pendingRemoval.id))
    if (removeSet.fulfilled.match(result)) setPendingRemoval(null)
  }

  const newSetButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/set/new")}>
      New set
    </Button>
  )

  return (
    <PageContainer
      title="Your sets"
      description="Pick a set to start training, or create a new one. The counter on each tile shows how many cards you have already learnt."
      actions={items.length > 0 ? newSetButton : undefined}
    >
      {status === "loading" && items.length === 0 && <LoadingState label="Loading your sets..." />}

      {status === "failed" && items.length === 0 && (
        <ErrorState message={error ?? "Could not load your sets."} onRetry={() => dispatch(fetchSets())} />
      )}

      {status !== "loading" && items.length === 0 && !error && (
        <EmptyState
          title="No sets yet"
          description="Create your first flashcard set to start learning. You can also import cards from a CSV file once a set exists."
          action={newSetButton}
        />
      )}

      {items.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {items.map((set) => (
            <SetTile
              key={set.id}
              set={set}
              onAction={handleAction}
              onToggleShuffle={(target) => dispatch(toggleShuffle({ setId: target.id, shuffle: !target.shuffle }))}
            />
          ))}
        </Box>
      )}

      <ImportDialog
        set={importTarget}
        submitting={saveStatus === "loading"}
        serverError={importTarget ? saveError : null}
        onClose={() => dispatch(closeImportDialog())}
        onConfirm={handleImport}
      />

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove this set?"
        description={
          pendingRemoval
            ? `"${pendingRemoval.name}" and all ${pendingRemoval.totalCards} of its cards will be permanently deleted, including your learning progress.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        busy={saveStatus === "loading"}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmRemoval}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => dispatch(clearSetsNotice())}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => dispatch(clearSetsNotice())}>
          {notice}
        </Alert>
      </Snackbar>
    </PageContainer>
  )
}
