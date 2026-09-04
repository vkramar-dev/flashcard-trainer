import UploadFileIcon from "@mui/icons-material/UploadFile"
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import type { ImportMode, SetSummary } from "../../types"
import { CsvParseError, parseCardsCsv, type CsvCard } from "../../utils/csv"

interface ImportDialogProps {
  set: SetSummary | null
  submitting: boolean
  serverError: string | null
  onClose: () => void
  onConfirm: (mode: ImportMode, cards: CsvCard[]) => void
}

export function ImportDialog({ set, submitting, serverError, onClose, onConfirm }: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>("append")
  const [fileName, setFileName] = useState<string | null>(null)
  const [cards, setCards] = useState<CsvCard[] | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const open = set !== null

  // Reset the form every time the dialog is opened for a set.
  useEffect(() => {
    if (open) {
      setMode("append")
      setFileName(null)
      setCards(null)
      setFileError(null)
    }
  }, [open])

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allow re-selecting the same file after a failed attempt.
    event.target.value = ""
    if (!file) return

    setFileName(file.name)
    setCards(null)
    setFileError(null)

    try {
      const parsed = parseCardsCsv(await file.text())
      setCards(parsed)
    } catch (error) {
      setFileError(
        error instanceof CsvParseError ? error.message : "The file could not be read. Please choose a valid CSV file.",
      )
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Import cards{set ? ` into ${set.name}` : ""}</DialogTitle>
      <DialogContent dividers>
        <Stack gap={3}>
          <Typography variant="body2" color="text.secondary">
            {'Choose a CSV file with one card per row: the first column is the front, the second is the back. Example: '}
            <Box component="code" sx={{ fontFamily: "monospace" }}>
              {'Haus,house'}
            </Box>
          </Typography>

          <Box>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => inputRef.current?.click()}
              disabled={submitting}
            >
              Choose CSV file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              hidden
              aria-hidden="true"
              tabIndex={-1}
            />
            {fileName && (
              <Typography variant="body2" sx={{ mt: 1.5, overflowWrap: "anywhere" }}>
                {fileName}
                {cards ? ` — ${cards.length} card${cards.length === 1 ? "" : "s"} ready to import` : ""}
              </Typography>
            )}
          </Box>

          <FormControl disabled={submitting}>
            <FormLabel id="import-mode-label">How should the cards be added?</FormLabel>
            <RadioGroup
              aria-labelledby="import-mode-label"
              value={mode}
              onChange={(event) => setMode(event.target.value as ImportMode)}
            >
              <FormControlLabel value="append" control={<Radio />} label="Append to the existing cards" />
              <FormControlLabel value="replace" control={<Radio />} label="Replace all existing cards" />
            </RadioGroup>
          </FormControl>

          {mode === "replace" && cards && (
            <Alert severity="warning">
              {`All ${set?.totalCards ?? 0} existing card${
                (set?.totalCards ?? 0) === 1 ? "" : "s"
              } in this set will be deleted, along with their learning progress.`}
            </Alert>
          )}

          {fileError && <Alert severity="error">{fileError}</Alert>}
          {serverError && <Alert severity="error">{serverError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => cards && onConfirm(mode, cards)}
          disabled={!cards || submitting}
          color={mode === "replace" ? "error" : "primary"}
        >
          {submitting ? "Importing..." : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
