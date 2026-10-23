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
} from "@mui/material";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { useSearchParams } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { SignedOutNotice } from "../features/auth/SignedOutNotice";
import { fetchStatisticsAsync } from "../features/statistics/statisticsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { SetStatisticsModel } from "../types";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Box>
      <Typography
        variant="h5"
        component="p"
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function SetStatisticsCard({
  stats,
  highlighted,
}: {
  stats: SetStatisticsModel;
  highlighted: boolean;
}) {
  const { t } = useTranslation();
  const percent =
    stats.totalCards > 0
      ? Math.round((stats.learntCards / stats.totalCards) * 100)
      : 0;

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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{ mb: 2 }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{ overflowWrap: "anywhere" }}
          >
            {stats.setName}
          </Typography>
          <Chip
            label={t("statistics.learntPercent", { percent })}
            color={percent === 100 ? "success" : "default"}
            size="small"
          />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={percent}
          aria-label={t("statistics.progressAria", { name: stats.setName })}
          sx={{ height: 8, borderRadius: 4, mb: 3 }}
        />

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={4}
          sx={{ mb: stats.hardestCards.length > 0 ? 3 : 0 }}
        >
          <Metric label={t("statistics.cardsInSet")} value={stats.totalCards} />
          <Metric label={t("statistics.cardsLearnt")} value={stats.learntCards} />
          <Metric label={t("statistics.cardsShown")} value={stats.totalCardsShown} />
        </Stack>

        {stats.hardestCards.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
              {t("statistics.hardest")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t("statistics.hardestHelp")}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("statistics.sideA")}</TableCell>
                  <TableCell>{t("statistics.sideB")}</TableCell>
                  <TableCell align="right">{t("statistics.missed")}</TableCell>
                  <TableCell align="right">{t("statistics.missRate")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.hardestCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell sx={{ overflowWrap: "anywhere" }}>
                      {card.front}
                    </TableCell>
                    <TableCell sx={{ overflowWrap: "anywhere" }}>
                      {card.back}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {card.unknownCount} / {card.shownCount}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                      }}
                    >
                      {Math.round((card.unknownCount * 100) / card.shownCount)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { bySet, status, error } = useAppSelector((state) => state.statistics);
  const { isAuthenticated, sessionChecked } = useAppSelector(
    (state) => state.auth,
  );

  const focusedSetId = useMemo(() => {
    const raw = searchParams.get("setId");
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchStatisticsAsync());
  }, [dispatch, isAuthenticated]);

  // Bring the set selected from the tile menu into view once data has arrived.
  useEffect(() => {
    if (focusedSetId === null || bySet.length === 0) return;
    document
      .getElementById(`set-statistics-${focusedSetId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusedSetId, bySet.length]);

  const ordered = useMemo(() => {
    if (focusedSetId === null) return bySet;
    // Keep the focused set first so it is immediately visible.
    return [...bySet].sort(
      (a, b) =>
        Number(b.setId === focusedSetId) - Number(a.setId === focusedSetId),
    );
  }, [bySet, focusedSetId]);

  if (!isAuthenticated) {
    return (
      <PageContainer
        title={t("statistics.title")}
        description={t("statistics.signedOutDescription")}
        maxWidth="md"
      >
        {sessionChecked ? (
          <SignedOutNotice
            icon={<InsightsOutlinedIcon />}
            title={t("statistics.signedOutTitle")}
            description={t("statistics.signedOutBody")}
          />
        ) : (
          <LoadingState label="home.checkingSession" />
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t("statistics.title")}
      description={t("statistics.description")}
      maxWidth="md"
    >
      {status === "loading" && bySet.length === 0 && (
        <LoadingState label="statistics.loading" />
      )}

      {status === "failed" && bySet.length === 0 && (
        <ErrorState
          message={error ?? "statistics.couldNotLoad"}
          onRetry={() => dispatch(fetchStatisticsAsync())}
        />
      )}

      {status === "succeeded" && bySet.length === 0 && (
        <EmptyState
          title={t("statistics.emptyTitle")}
          description={t("statistics.emptyDescription")}
        />
      )}

      {ordered.length > 0 && (
        <Stack gap={3}>
          {ordered.map((stats) => (
            <SetStatisticsCard
              key={stats.setId}
              stats={stats}
              highlighted={stats.setId === focusedSetId}
            />
          ))}
        </Stack>
      )}
    </PageContainer>
  );
}
