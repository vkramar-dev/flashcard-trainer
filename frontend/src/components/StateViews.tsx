import { Alert, AlertTitle, Box, Button, CircularProgress, Stack, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { text } from "../i18n"

export function LoadingState({ label = "common.loading" }: { label?: string }) {
  const { t } = useTranslation()

  return (
    <Stack alignItems="center" justifyContent="center" gap={2} sx={{ py: 8 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {text(label) || t("common.loading")}
      </Typography>
    </Stack>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation()

  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>{t("common.somethingWentWrong")}</AlertTitle>
      {text(message)}
    </Alert>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mx: "auto", maxWidth: "48ch" }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  )
}
