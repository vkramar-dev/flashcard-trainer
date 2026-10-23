import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { text } from "../i18n";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageContainer } from "../components/PageContainer";
import { HomeSignedOutHero } from "../features/auth/HomeSignedOutHero";
import { ErrorState, LoadingState } from "../components/StateViews";
import { ImportDialog } from "../features/sets/ImportDialog";
import { SetTile, type SetTileAction } from "../features/sets/SetTile";
import {
  clearSetsNotice,
  closeImportDialog,
  exportSetAsync,
  loadAppStateAsync,
  importCardsAsync,
  openImportDialog,
  deleteSetAsync,
} from "../features/sets/setsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { ImportMode, FullSetModel } from "../types";
import {
  downloadCsv,
  toCardsCsv,
  toCsvFileName,
  type CsvCard,
} from "../utils/csv";
import { startTrainingAsync } from "@/features/training/trainingSlice";
import { SetsEmptyHero } from "../features/sets/SetsEmptyHero";

export default function HomePage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, status, error, saveStatus, saveError, importSetId, notice } =
    useAppSelector((state) => state.sets);
  const userName = useAppSelector((state) => state.auth.user?.email);
  const { hideKnownCards } = useAppSelector((state) => state.settings);
  const { isAuthenticated, sessionChecked } = useAppSelector(
    (state) => state.auth,
  );
  const [pendingRemoval, setPendingRemoval] = useState<FullSetModel | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <PageContainer>
        {sessionChecked ? (
          <HomeSignedOutHero />
        ) : (
          <LoadingState label="home.checkingSession" />
        )}
      </PageContainer>
    );
  }

  if (!userName) return null;

  const importTarget = items.find((item) => item.id === importSetId) ?? null;

  const handleExport = async (set: FullSetModel) => {
    const result = await dispatch(exportSetAsync(set.id));
    if (exportSetAsync.fulfilled.match(result)) {
      downloadCsv(
        toCsvFileName(result.payload.name),
        toCardsCsv(result.payload.cards),
      );
    }
  };

  const handleAction = async (action: SetTileAction, set: FullSetModel) => {
    switch (action) {
      case "start":
        try {
          await dispatch(
            startTrainingAsync({
              userName,
              setId: set.id,
              shouldHide: hideKnownCards,
            }),
          ).unwrap();
          setActionError(null);
          navigate(`/set/${set.id}/train`);
        } catch (error) {
          setActionError(
            typeof error === "string" ? error : "home.couldNotStart",
          );
        }
        break;
      case "view":
        navigate(`/set/${set.id}/view`);
        break;
      case "edit":
        navigate(`/set/${set.id}/edit`);
        break;
      case "import":
        dispatch(openImportDialog(set.id));
        break;
      case "export":
        void handleExport(set);
        break;
      case "statistics":
        navigate(`/statistics?setId=${set.id}`);
        break;
      case "remove":
        setPendingRemoval(set);
        break;
    }
  };

  const handleImport = (mode: ImportMode, cards: CsvCard[]) => {
    if (importSetId === null) return;
    dispatch(importCardsAsync({ setId: importSetId, mode, cards }));
  };

  const confirmRemoval = async () => {
    if (!pendingRemoval) return;
    const result = await dispatch(deleteSetAsync(pendingRemoval.id));
    if (deleteSetAsync.fulfilled.match(result)) setPendingRemoval(null);
  };

  const newSetButton = (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => navigate("/set/new")}
    >
      {t("home.newSet")}
    </Button>
  );

  const isEmpty = status !== "loading" && items.length === 0 && !error;

  return (
    <PageContainer
      title={isEmpty ? undefined : t("home.yourSets")}
      description={
        isEmpty ? undefined : t("home.startOrCreate")
      }
      actions={items.length > 0 ? newSetButton : undefined}
    >
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {text(actionError)}
        </Alert>
      )}

      {status === "loading" && items.length === 0 && (
        <LoadingState label="home.loadingSets" />
      )}

      {status === "failed" && items.length === 0 && (
        <ErrorState
          message={error ?? "home.couldNotLoad"}
          onRetry={() => dispatch(loadAppStateAsync())}
        />
      )}

      {status !== "loading" && items.length === 0 && !error && (
        <SetsEmptyHero onCreate={() => navigate("/set/new")} />
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
        title={t("home.removeTitle")}
        description={
          pendingRemoval
            ? t("home.removeDescription", {
                count: pendingRemoval.totalCards,
                name: pendingRemoval.name,
              })
            : ""
        }
        confirmLabel="common.remove"
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
        <Alert
          severity="success"
          variant="filled"
          onClose={() => dispatch(clearSetsNotice())}
        >
          {notice ? t(notice.key, { count: notice.count ?? 0 }) : null}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
