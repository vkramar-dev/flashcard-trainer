import { Alert, AlertTitle, Box, Button, CircularProgress, Stack, Typography } from "@mui/material"
import type { ReactNode } from "react"

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <Stack alignItems="center" justifyContent="center" gap={2} sx={{ py: 8 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>Something went wrong</AlertTitle>
      {message}
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
