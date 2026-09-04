import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { PageContainer } from "../components/PageContainer"
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews"
import { SignedOutNotice } from "../features/auth/SignedOutNotice"
import { fetchStatistics } from "../features/statistics/statisticsSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import type { SetStatistics } from "../types"

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Box>
      <Typography variant="h5" component="p" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}

function SetStatisticsCard({ stats, highlighted }: { stats: SetStatistics; highlighted: boolean }) {
  const percent = stats.totalCards > 0 ? Math.round((stats.learntCards / stats.totalCards) * 100) : 0

  return (
    <Card
      id={`set-statistics-${stats.setId}`}
      sx={{
        borderColor: highlighted ? "primary.main" : undefined,
        borderWidth: highlighted ? 2 : 1,
        scrollMarginTop: 96,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ overflowWrap: "anywhere" }}>
            {stats.setName}
          </Typography>
          <Chip label={`${percent}% learnt`} color={percent === 100 ? "success" : "default"} size="small" />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={percent}
          aria-label={`${stats.setName} progress`}
          sx={{ height: 8, borderRadius: 4, mb: 3 }}
        />

        <Stack direction="row" flexWrap="wrap" gap={4} sx={{ mb: stats.hardestCards.length > 0 ? 3 : 0 }}>
          <Metric label="Cards in set" value={stats.totalCards} />
          <Metric label="Cards learnt" value={stats.learntCards} />
          <Metric label="Total cards shown" value={stats.totalCardsShown} />
        </Stack>

        {stats.hardestCards.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
              Hardest cards
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {'Ranked by how often you answered "I don\'t know" relative to how often the card was shown.'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Front</TableCell>
                  <TableCell>Back</TableCell>
                  <TableCell align="right">Missed</TableCell>
                  <TableCell align="right">Miss rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.hardestCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell sx={{ overflowWrap: "anywhere" }}>{card.front}</TableCell>
                    <TableCell sx={{ overflowWrap: "anywhere" }}>{card.back}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {card.unknownCount} / {card.shownCount}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      {Math.round(card.missRate * 100)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function StatisticsPage() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { bySet, status, error } = useAppSelector((state) => state.statistics)
  const { isAuthenticated, sessionChecked } = useAppSelector((state) => state.auth)

  const focusedSetId = useMemo(() => {
    const raw = searchParams.get("setId")
    const parsed = raw ? Number(raw) : Number.NaN
    return Number.isFinite(parsed) ? parsed : null
  }, [searchParams])

  useEffect(() => {
    if (!isAuthenticated) return
    dispatch(fetchStatistics())
  }, [dispatch, isAuthenticated])

  // Bring the set selected from the tile menu into view once data has arrived.
  useEffect(() => {
    if (focusedSetId === null || bySet.length === 0) return
    document.getElementById(`set-statistics-${focusedSetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [focusedSetId, bySet.length])

  const ordered = useMemo(() => {
    if (focusedSetId === null) return bySet
    // Keep the focused set first so it is immediately visible.
    return [...bySet].sort((a, b) => Number(b.setId === focusedSetId) - Number(a.setId === focusedSetId))
  }, [bySet, focusedSetId])

  if (!isAuthenticated) {
    return (
      <PageContainer
        title="Statistics"
        description="Statistics are calculated from your own training history, so they are only available once you are signed in."
        maxWidth="md"
      >
        {sessionChecked ? (
          <SignedOutNotice
            title="Sign in to see your progress"
            description="Every answer you give while training is counted against your account. Without a session there is no history to report on."
            highlights={[
              "See how many cards you have learnt in each set",
              "Check how often each card has been shown to you",
              "Find the cards you miss most and train them again",
            ]}
          />
        ) : (
          <LoadingState label="Checking your session..." />
        )}
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Statistics"
      description="Progress for every set, including how often each card has been shown and which ones you miss most."
      maxWidth="md"
    >
      {status === "loading" && bySet.length === 0 && <LoadingState label="Loading your statistics..." />}

      {status === "failed" && bySet.length === 0 && (
        <ErrorState message={error ?? "Could not load your statistics."} onRetry={() => dispatch(fetchStatistics())} />
      )}

      {status === "succeeded" && bySet.length === 0 && (
        <EmptyState
          title="No statistics yet"
          description="Once you create a set and train with it, your progress will show up here."
        />
      )}

      {ordered.length > 0 && (
        <Stack gap={3}>
          {ordered.map((stats) => (
            <SetStatisticsCard key={stats.setId} stats={stats} highlighted={stats.setId === focusedSetId} />
          ))}
        </Stack>
      )}
    </PageContainer>
  )
}
