import { Box, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import { useAppSelector } from "../store/hooks";

const usageFormat = new Intl.NumberFormat("en-US");

function formatPercent(used: number, limit: number): string {
  if (limit <= 0) return "0%";
  return `${((used / limit) * 100).toFixed(1)}%`;
}

export function Footer() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const storage = useAppSelector((state) => state.sets.storage);
  const year = new Date().getFullYear();
  const showUsage = isAuthenticated && storage !== null;
  const used = storage?.usedCharacters ?? 0;
  const limit = storage?.characterLimit ?? 0;
  const percentLabel = formatPercent(used, limit);
  const barValue = limit <= 0 ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "background.default",
        borderTop: "1px solid",
        borderColor: "divider",
        px: { xs: 2, md: 3 },
        py: 2,
        containerType: "inline-size",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: showUsage ? "1fr auto 1fr" : "1fr",
          alignItems: "center",
          columnGap: 2,
          ...(showUsage && {
            "@container (max-width: 520px)": {
              gridTemplateColumns: "auto auto",
              justifyContent: "space-between",
              "& .footer-copy": {
                gridColumn: "1",
                justifySelf: "start",
                textAlign: "left",
              },
              "& .footer-storage": {
                gridColumn: "2",
                justifySelf: "end",
              },
            },
          }),
        }}
      >
        <Typography
          className="footer-copy"
          variant="caption"
          color="text.secondary"
          sx={{ gridColumn: showUsage ? "2" : "1", justifySelf: "center", textAlign: "center" }}
        >
          © {year} Flashcard Trainer
        </Typography>
        {showUsage && (
          <Tooltip
            title={`Used ${usageFormat.format(used)} of ${usageFormat.format(limit)} characters`}
            enterTouchDelay={0}
            leaveTouchDelay={4000}
          >
            <Box className="footer-storage" sx={{ gridColumn: "3", justifySelf: "end", width: "max-content", maxWidth: "100%" }}>
              <Stack direction="row" alignItems="baseline" gap="8px">
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                  Storage used:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {percentLabel}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={barValue}
                aria-label="Storage used"
                sx={{
                  mt: 0.25,
                  width: "100%",
                  height: 3,
                  borderRadius: 999,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(31,41,51,0.12)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                  },
                }}
              />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
