import MoreVertIcon from "@mui/icons-material/MoreVert"
import { Box, Card, CardActionArea, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material"
import { useState, type MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import type { FullSetModel } from "../../types"
import { formatDate } from "../../utils/date"

export type SetTileAction = "start" | "view" | "edit" | "import" | "export" | "statistics" | "remove"

const menuItems: Array<{ action: SetTileAction; labelKey: string; destructive?: boolean }> = [
  { action: "start", labelKey: "sets.start" },
  { action: "view", labelKey: "sets.viewCards" },
  { action: "edit", labelKey: "sets.addEdit" },
  { action: "import", labelKey: "sets.import" },
  { action: "export", labelKey: "sets.export" },
  { action: "statistics", labelKey: "sets.statistics" },
  { action: "remove", labelKey: "sets.remove", destructive: true },
]

function shownDate(value: string, unknownLabel: string) {
  return value === "unknown" ? unknownLabel : value
}

interface SetTileProps {
  set: FullSetModel
  onAction: (action: SetTileAction, set: FullSetModel) => void
}

export function SetTile({ set, onAction }: SetTileProps) {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const unknown = t("common.unknown")

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleSelect = (action: SetTileAction) => {
    setAnchorEl(null)
    onAction(action, set)
  }

  return (
    <Card
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition:
          "box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
          borderColor: "primary.main",
          bgcolor: "action.hover",
        },
        "&:focus-within": {
          borderColor: "primary.main",
        },
      }}
    >
      <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}>
        <IconButton
          aria-label={t("sets.actionsFor", { name: set.name })}
          aria-haspopup="menu"
          aria-expanded={anchorEl ? true : undefined}
          onClick={openMenu}
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

      <CardActionArea
        onClick={() => onAction("start", set)}
        aria-label={t("sets.startTraining", { name: set.name })}
        sx={{
          flex: 1,
          px: 3,
          pt: 5,
          pb: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          minHeight: 150,
          "& .MuiCardActionArea-focusHighlight": {
            display: "none",
          },
        }}
      >
        <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3, overflowWrap: "anywhere" }}>
          {set.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontVariantNumeric: "tabular-nums" }}>
          {set.learntCards} / {set.totalCards}
        </Typography>
      </CardActionArea>

      <Divider />

      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={1} sx={{ px: 2, py: 1.25 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {t("sets.modified", { date: shownDate(formatDate(set.modified), unknown) })}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {t("sets.lastTrained", { date: shownDate(formatDate(set.lastTrained), unknown) })}
          </Typography>
        </Box>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {menuItems.flatMap((item) => {
          const menuItem = (
            <MenuItem
              key={item.action}
              onClick={() => handleSelect(item.action)}
              sx={item.destructive ? { color: "error.main" } : undefined}
            >
              {t(item.labelKey)}
            </MenuItem>
          )
          return item.destructive ? [<Divider key={`${item.action}-divider`} />, menuItem] : [menuItem]
        })}
      </Menu>
    </Card>
  )
}
