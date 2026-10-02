import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined"
import { Box } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"

export function FlashcardsIllustration() {
  const theme = useTheme()

  const primary = theme.palette.primary.main
  const paper = theme.palette.background.paper

  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: { xs: 220, md: 270 },
        height: { xs: 190, md: 230 },
        mb: { xs: 3, md: 4 },
      }}
    >
      {/* Soft glow behind cards */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(
            circle at 50% 42%,
            ${alpha(primary, 0.18)} 0%,
            ${alpha(primary, 0.08)} 34%,
            transparent 72%
          )`,
          filter: "blur(10px)",
        }}
      />

      {/* Ground shadow */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          bottom: 8,
          transform: "translateX(-50%)",
          width: { xs: 120, md: 150 },
          height: 20,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.common.black, 0.22),
          filter: "blur(12px)",
        }}
      />

      {/* Back card 1 */}
      <Box
        sx={{
          position: "absolute",
          width: { xs: 104, md: 118 },
          height: { xs: 142, md: 160 },
          left: "50%",
          top: { xs: 30, md: 34 },
          transform: "translateX(-78%) rotate(-12deg)",
          borderRadius: 2.5,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(paper, 0.78)
              : alpha(theme.palette.common.white, 0.9),
          border: `1px solid ${alpha(primary, 0.12)}`,
          boxShadow: `0 14px 30px ${alpha(
            theme.palette.common.black,
            0.18,
          )}`,
        }}
      />

      {/* Back card 2 */}
      <Box
        sx={{
          position: "absolute",
          width: { xs: 108, md: 122 },
          height: { xs: 146, md: 164 },
          left: "50%",
          top: { xs: 25, md: 28 },
          transform: "translateX(-63%) rotate(-7deg)",
          borderRadius: 2.5,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(paper, 0.92)
              : alpha(theme.palette.background.paper, 0.98),
          border: `1px solid ${alpha(primary, 0.16)}`,
          boxShadow: `0 16px 34px ${alpha(
            theme.palette.common.black,
            0.18,
          )}`,
        }}
      />

      {/* Front card */}
      <Box
        sx={{
          position: "absolute",
          width: { xs: 104, md: 118 },
          height: { xs: 156, md: 178 },
          left: "50%",
          top: { xs: 16, md: 18 },
          transform: "translateX(-43%) rotate(4deg)",
          borderRadius: 2.5,

          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(
                  145deg,
                  ${alpha("#fff", 0.06)} 0%,
                  ${alpha(primary, 0.96)} 18%,
                  ${alpha(primary, 0.74)} 100%
                )`
              : `linear-gradient(
                  145deg,
                  ${alpha("#fff", 0.72)} 0%,
                  ${alpha(primary, 0.94)} 22%,
                  ${alpha(primary, 0.78)} 100%
                )`,

          border: `1px solid ${alpha(
            theme.palette.common.white,
            theme.palette.mode === "dark" ? 0.18 : 0.45,
          )}`,

          boxShadow: `0 20px 42px ${alpha(
            theme.palette.common.black,
            0.24,
          )}`,

          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SchoolOutlinedIcon
          sx={{
            fontSize: { xs: 34, md: 40 },
            color: theme.palette.primary.contrastText,
            mb: 2,
          }}
        />

        <Box
          sx={{
            width: { xs: 50, md: 58 },
            height: 6,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.primary.contrastText, 0.28),
            mb: 1,
          }}
        />

        <Box
          sx={{
            width: { xs: 38, md: 44 },
            height: 6,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.primary.contrastText, 0.2),
          }}
        />
      </Box>

      {/* Accent strokes */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 10, md: 12 },
          left: "41%",
          width: 4,
          height: 22,
          borderRadius: 999,
          bgcolor: primary,
          transform: "rotate(8deg)",
          opacity: 0.9,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: { xs: 28, md: 30 },
          left: "29%",
          width: 4,
          height: 18,
          borderRadius: 999,
          bgcolor: primary,
          transform: "rotate(-32deg)",
          opacity: 0.72,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: { xs: 24, md: 28 },
          left: "53%",
          width: 3,
          height: 14,
          borderRadius: 999,
          bgcolor: primary,
          transform: "rotate(28deg)",
          opacity: 0.72,
        }}
      />

      {/* Left sparkle */}
      <Box
        sx={{
          position: "absolute",
          left: { xs: 24, md: 34 },
          top: { xs: 82, md: 96 },
          width: 12,
          height: 12,
          transform: "rotate(45deg)",
          bgcolor: alpha(primary, 0.9),
          borderRadius: "2px",
          boxShadow: `0 0 14px ${alpha(primary, 0.24)}`,
        }}
      />

      {/* Right sparkle */}
      <Box
        sx={{
          position: "absolute",
          right: { xs: 24, md: 34 },
          top: { xs: 70, md: 84 },
          width: 10,
          height: 10,
          transform: "rotate(45deg)",
          bgcolor: alpha(primary, 0.82),
          borderRadius: "2px",
          boxShadow: `0 0 12px ${alpha(primary, 0.2)}`,
        }}
      />
    </Box>
  )
}