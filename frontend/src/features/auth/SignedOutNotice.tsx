import { Box, Button, Card, CardContent, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { openAuthDialog } from "./authSlice"
import { useAppDispatch } from "../../store/hooks"

interface SignedOutNoticeProps {
  icon: ReactNode
  title: string
  description: string
}

export function SignedOutNotice({
  icon,
  title,
  description,
}: SignedOutNoticeProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  return (
    <Card
      sx={{
        maxWidth: 480,
        mx: "auto",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 3, md: 4 },
          textAlign: "center",
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "grid",
            placeItems: "center",
            width: 56,
            height: 56,
            mx: "auto",
            mb: 2.5,
            borderRadius: 3,
            bgcolor: "background.default",
            color: "primary.main",
            border: 1,
            borderColor: "divider",
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="h5"
          component="h2"
          sx={{
            mb: 1.25,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mx: "auto",
            maxWidth: "40ch",
            mb: 3,
          }}
        >
          {description}
        </Typography>

        <Button
          variant="contained"
          onClick={() => dispatch(openAuthDialog("signIn"))}
          sx={{
            minHeight: 44,
            px: 3.5,
          }}
        >
          {t("home.signIn")}
        </Button>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          {t("home.newHere")}{" "}
          <Button
            variant="text"
            size="small"
            onClick={() => dispatch(openAuthDialog("signUp"))}
            sx={{
              minWidth: 0,
              p: 0,
              verticalAlign: "baseline",
              fontSize: "inherit",
              fontWeight: 600,
              ml: 1,
            }}
          >
            {t("home.createAccount")}
          </Button>
        </Typography>
      </CardContent>
    </Card>
  )
}