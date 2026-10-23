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
import { useTranslation } from "react-i18next"
import { text } from "../../i18n"
import type { ImportMode, FullSetModel } from "../../types"
import { CsvParseError, parseCardsCsv, type CsvCard } from "../../utils/csv"

interface FileError {
  key: string
  values?: Record<string, string | number>
}

interface ImportDialogProps {
  set: FullSetModel | null
  submitting: boolean
  serverError: string | null
  onClose: () => void
  onConfirm: (mode: ImportMode, cards: CsvCard[]) => void
}

export function ImportDialog({ set, submitting, serverError, onClose, onConfirm }: ImportDialogProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>("append")
  const [fileName, setFileName] = useState<string | null>(null)
  const [cards, setCards] = useState<CsvCard[] | null>(null)
  const [fileError, setFileError] = useState<FileError | null>(null)

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
        error instanceof CsvParseError
          ? { key: error.message, values: error.values }
          : { key: "import.unreadable" },
      )
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {set ? t("import.title", { name: set.name }) : t("import.titlePlain")}
      </DialogTitle>
      <DialogContent dividers>
        <Stack gap={3}>
          <Typography variant="body2" color="text.secondary">
            {t("import.help")}{" "}
            <Box component="code" sx={{ fontFamily: "monospace" }}>
              {"Haus,house"}
            </Box>
          </Typography>

          <Box>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => inputRef.current?.click()}
              disabled={submitting}
            >
              {t("import.chooseFile")}
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
                {cards ? ` ${t("import.ready", { count: cards.length })}` : ""}
              </Typography>
            )}
          </Box>

          <FormControl disabled={submitting}>
            <FormLabel id="import-mode-label">{t("import.how")}</FormLabel>
            <RadioGroup
              aria-labelledby="import-mode-label"
              value={mode}
              onChange={(event) => setMode(event.target.value as ImportMode)}
            >
              <FormControlLabel value="append" control={<Radio />} label={t("import.append")} />
              <FormControlLabel value="replace" control={<Radio />} label={t("import.replace")} />
            </RadioGroup>
          </FormControl>

          {mode === "replace" && cards && (
            <Alert severity="warning">
              {t("import.replaceWarning", { count: set?.totalCards ?? 0 })}
            </Alert>
          )}

          {fileError && (
            <Alert severity="error">
              {t(fileError.key, { count: Number(fileError.values?.count ?? 0), ...fileError.values })}
            </Alert>
          )}
          {serverError && <Alert severity="error">{text(serverError)}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={() => cards && onConfirm(mode, cards)}
          disabled={!cards || submitting}
          color={mode === "replace" ? "error" : "primary"}
        >
          {submitting ? t("import.importing") : t("import.import")}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
