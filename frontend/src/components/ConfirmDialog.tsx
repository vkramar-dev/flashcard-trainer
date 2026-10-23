import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { text } from "../i18n"

interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  cancelLabel?: string
  confirmLabel?: string
  /** Renders the confirm action in the error color for destructive operations. */
  destructive?: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel = "common.cancel",
  confirmLabel = "common.confirm",
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useTranslation()
  const cancelText = typeof cancelLabel === "string" ? text(cancelLabel) : cancelLabel
  const confirmText = typeof confirmLabel === "string" ? text(confirmLabel) : confirmLabel

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      {description && (
        <DialogContent>
          <DialogContentText>{description}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} color="inherit" disabled={busy}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={destructive ? "error" : "primary"} disabled={busy}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
