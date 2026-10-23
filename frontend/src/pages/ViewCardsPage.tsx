import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import GridViewIcon from "@mui/icons-material/GridView"
import ViewListIcon from "@mui/icons-material/ViewList"
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { setsApi } from "../api/setsApi"
import { toErrorMessage } from "../api/client"
import { PageContainer } from "../components/PageContainer"
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews"
import type { SetWithCardsModel } from "../types"

type CardsViewMode = "tiles" | "list"

function BackLink({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={onClick} sx={{ ml: -1, mb: 1 }}>
      {t("common.back")}
    </Button>
  )
}

function BackToSetsButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<ArrowBackIcon />}
        onClick={onClick}
        sx={{ borderRadius: 999, px: 2.5 }}
      >
        {t("common.backToSets")}
      </Button>
    </Box>
  )
}

export default function ViewCardsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setId: setIdParam } = useParams<{ setId: string }>()
  const setId = setIdParam ? Number(setIdParam) : Number.NaN

  const [set, setSet] = useState<SetWithCardsModel | null>(null)
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">("loading")
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<CardsViewMode>("tiles")

  const load = useCallback(async () => {
    if (!Number.isFinite(setId)) {
      setStatus("failed")
      setError("sets.setNotFound")
      return
    }

    setStatus("loading")
    setError(null)
    try {
      const data = await setsApi.fetchOne(setId)
      setSet(data)
      setStatus("succeeded")
    } catch (loadError) {
      setSet(null)
      setStatus("failed")
      setError(toErrorMessage(loadError, "errors.loadSet"))
    }
  }, [setId])

  useEffect(() => {
    void load()
  }, [load])

  const viewToggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={mode}
      aria-label={t("sets.viewAria")}
      onChange={(_, next: CardsViewMode | null) => {
        if (next) setMode(next)
      }}
    >
      <ToggleButton value="tiles" aria-label={t("sets.tiles")}>
        <GridViewIcon fontSize="small" sx={{ mr: 0.75 }} />
        {t("sets.tiles")}
      </ToggleButton>
      <ToggleButton value="list" aria-label={t("sets.list")}>
        <ViewListIcon fontSize="small" sx={{ mr: 0.75 }} />
        {t("sets.list")}
      </ToggleButton>
    </ToggleButtonGroup>
  )

  const goBack = () => navigate("/")

  if (status === "loading") {
    return (
      <PageContainer maxWidth="xl">
        <BackLink onClick={goBack} />
        <LoadingState label="sets.loadingCards" />
      </PageContainer>
    )
  }

  if (status === "failed" || !set) {
    return (
      <PageContainer maxWidth="xl">
        <BackLink onClick={goBack} />
        <ErrorState message={error ?? "errors.loadSet"} onRetry={() => void load()} />
        <BackToSetsButton onClick={goBack} />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      <Paper sx={{ px: { xs: 2, sm: 3 }, py: 2, mb: 3, borderRadius: 1.5 }}>
        <BackLink onClick={goBack} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
          gap={2}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ letterSpacing: "-0.02em" }}>
              {set.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("sets.cardCount", { count: set.cards.length })}
            </Typography>
          </Box>
          {viewToggle}
        </Stack>
      </Paper>
      {set.cards.length === 0 ? (
        <EmptyState title={t("sets.noCardsTitle")} description={t("sets.noCardsDescription")} />
      ) : mode === "tiles" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
              xl: "repeat(5, minmax(0, 1fr))",
            },
            gap: 1.5,
            alignItems: "start",
          }}
        >
          {set.cards.map((card) => (
            <Paper
              key={card.id ?? `${card.front}-${card.back}`}
              variant="outlined"
              sx={{ borderRadius: 2, overflow: "hidden" }}
            >
              <Box sx={{ px: 1.5, py: 1.25 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t("common.front")}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {card.front}
                </Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 1.25, bgcolor: "action.hover" }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t("common.backSide")}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {card.back}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: { xs: 40, sm: 56 }, fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ width: "46%", fontWeight: 600 }}>{t("common.front")}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t("common.backSide")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {set.cards.map((card, index) => (
                <TableRow key={card.id ?? index} hover>
                  <TableCell sx={{ verticalAlign: "top", color: "text.secondary" }}>{index + 1}</TableCell>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {card.front}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {card.back}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <BackToSetsButton onClick={goBack} />
    </PageContainer>
  )
}
