import { Box, Container, Stack, Typography } from "@mui/material"
import type { ReactNode } from "react"

interface PageContainerProps {
  title: string
  description?: string
  /** Rendered on the right of the title on wide screens. */
  actions?: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl"
  children: ReactNode
}

export function PageContainer({ title, description, actions, maxWidth = "lg", children }: PageContainerProps) {
  return (
    <Container maxWidth={maxWidth} sx={{ py: { xs: 3, md: 5 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-end" }}
        gap={2}
        sx={{ mb: { xs: 3, md: 4 } }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ letterSpacing: "-0.02em" }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: "60ch" }}>
              {description}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>{actions}</Box>}
      </Stack>
      {children}
    </Container>
  )
}
