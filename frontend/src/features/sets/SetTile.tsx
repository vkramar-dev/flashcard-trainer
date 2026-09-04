import MoreVertIcon from "@mui/icons-material/MoreVert"
import { Box, Card, CardActionArea, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material"
import { useState, type MouseEvent } from "react"
import type { SetSummary } from "../../types"
import { formatDate } from "../../utils/date"
import { ShufflePushpin } from "./ShufflePushpin"

export type SetTileAction = "start" | "edit" | "import" | "export" | "statistics" | "remove"

const menuItems: Array<{ action: SetTileAction; label: string; destructive?: boolean }> = [
  { action: "start", label: "Start" },
  { action: "edit", label: "Add/Edit" },
  { action: "import", label: "Import" },
  { action: "export", label: "Export" },
  { action: "statistics", label: "Statistics" },
  { action: "remove", label: "Remove", destructive: true },
]

interface SetTileProps {
  set: SetSummary
  onAction: (action: SetTileAction, set: SetSummary) => void
  onToggleShuffle: (set: SetSummary) => void
}

export function SetTile({ set, onAction, onToggleShuffle }: SetTileProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

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
        transition: "box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)", borderColor: "primary.main" },
        "&:focus-within": { borderColor: "primary.main" },
      }}
    >
      <Box sx={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}>
        <IconButton
          aria-label={`Actions for ${set.name}`}
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
        aria-label={`Start training ${set.name}`}
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
            Modified: {formatDate(set.modified)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Last trained: {formatDate(set.created)}
          </Typography>
        </Box>
        <ShufflePushpin enabled={set.shuffle} setName={set.name} onToggle={() => onToggleShuffle(set)} />
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.action}
            onClick={() => handleSelect(item.action)}
            sx={item.destructive ? { color: "error.main" } : undefined}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Card>
  )
}
