import ShuffleIcon from "@mui/icons-material/Shuffle"
import ShuffleOnIcon from "@mui/icons-material/ShuffleOn"
import { IconButton, Tooltip } from "@mui/material"

interface ShuffleToggleProps {
  enabled: boolean
  setName: string
  onToggle: () => void
}

/**
 * Shuffle control for a set.
 * Highlighted means cards are shuffled at the start of each session.
 * Muted means cards stay in the order they were created.
 */
export function ShuffleToggle({ enabled, setName, onToggle }: ShuffleToggleProps) {
  const Icon = enabled ? ShuffleOnIcon : ShuffleIcon

  return (
    <Tooltip title={enabled ? "Shuffle on - click to turn off" : "Shuffle off - click to turn on"}>
      <IconButton
        onClick={onToggle}
        aria-label={enabled ? `Shuffle is on for ${setName}` : `Shuffle is off for ${setName}`}
        aria-pressed={enabled}
        size="small"
        sx={{
          color: enabled ? "secondary.main" : "text.disabled",
          transition: "color 160ms ease",
          "& .MuiSvgIcon-root": {
            fontSize: 22,
          },
          "&:hover": { transform: "scale(1.12)" },
        }}
      >
        <Icon />
      </IconButton>
    </Tooltip>
  )
}
