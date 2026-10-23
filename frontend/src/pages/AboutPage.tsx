import { Box, Card, CardContent, Link, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../components/PageContainer";
import StyleIcon from "@mui/icons-material/Style";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <PageContainer
      title={t("about.title")}
      description={t("about.description")}
      maxWidth="md"
      actions={
        <Box
          aria-hidden
          sx={{
            display: { xs: "none", sm: "grid" },
            placeItems: "center",
            width: 72,
            height: 72,
            borderRadius: 3,
            bgcolor: "background.paper",
            color: "primary.main",
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
            mr: 1.25,
          }}
        >
          <StyleIcon sx={{ fontSize: 34 }} />
        </Box>
      }
    >
      <Stack gap={3}>
        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
              {t("about.recallTitle")}
            </Typography>

            <Stack gap={2}>
              <Typography variant="body1" color="text.secondary">
                {t("about.recall1")}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                {t("about.recall2")}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                {t("about.recall3")}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              {t("about.technology")}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {t("about.technologyBody")}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              {t("about.contact")}
            </Typography>

            <Stack gap={0.75}>
              <Typography variant="body2" color="text.secondary">
                Vladimir Kramar
              </Typography>

              {/* <Typography variant="body2" color="text.secondary">
                Website:{" "}
                <Link
                  href="https://vladimirkramar.online"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vladimirkramar.online
                </Link>
              </Typography> */}

              <Typography variant="body2" color="text.secondary">
                {t("about.email")}{" "}
                <Link href="mailto:vkramar.biz@gmail.com">
                  vkramar.biz@gmail.com
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </PageContainer>
  );
}
