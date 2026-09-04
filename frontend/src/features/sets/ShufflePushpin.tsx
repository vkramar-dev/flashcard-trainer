import PushPinIcon from "@mui/icons-material/PushPin"
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined"
import { IconButton, Tooltip } from "@mui/material"

interface ShufflePushpinProps {
  enabled: boolean
  setName: string
  onToggle: () => void
}

/**
 * Pushpin button controlling the shuffle preference of a set.
 * Pinned (filled, upright, accent colour) means shuffle is on.
 * Unpinned (outlined, tilted, muted) means shuffle is off.
 */
export function ShufflePushpin({ enabled, setName, onToggle }: ShufflePushpinProps) {
  const Icon = enabled ? PushPinIcon : PushPinOutlinedIcon

  return (
    <Tooltip title={enabled ? "Shuffle on - click to turn off" : "Shuffle off - click to turn on"}>
      <IconButton
        onClick={onToggle}
        aria-label={enabled ? `Shuffle is on for ${setName}` : `Shuffle is off for ${setName}`}
        aria-pressed={enabled}
        size="small"
        sx={{
          color: enabled ? "secondary.main" : "text.disabled",
          transition: "transform 160ms ease, color 160ms ease",
          "& .MuiSvgIcon-root": {
            fontSize: 22,
            // Lying down when unpinned, driven straight in when pinned.
            transform: enabled ? "rotate(0deg)" : "rotate(45deg)",
            transition: "transform 160ms ease",
          },
          "&:hover": { transform: "scale(1.12)" },
        }}
      >
        <Icon />
      </IconButton>
    </Tooltip>
  )
}
