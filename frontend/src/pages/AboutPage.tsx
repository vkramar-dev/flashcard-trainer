import { Card, CardContent, Link, Stack, Typography } from "@mui/material"
import { PageContainer } from "../components/PageContainer"

export default function AboutPage() {
  return (
    <PageContainer
      title="About"
      description="A simple way to practise what you want to remember."
      maxWidth="md"
    >
      <Stack gap={3}>
        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
              Learn by active recall
            </Typography>

            <Stack gap={2}>
              <Typography variant="body1" color="text.secondary">
                Flashcard Trainer is built around active recall: instead of repeatedly
                rereading information, you try to retrieve it from memory.
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Create your own card sets, practise them at your own pace, and use the
                statistics to focus on what still needs more attention.
              </Typography>

              <Typography variant="body1" color="text.secondary">
                The application supports shuffled training, optional hiding of learned
                cards, CSV import and export, and persistent user accounts with saved
                settings and progress.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Technology
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Flashcard Trainer is a web application built with React, TypeScript,
              Redux Toolkit and Material UI on the frontend, with an ASP.NET Core Web
              API, Entity Framework Core, ASP.NET Core Identity and SQL Server on the
              backend.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Contact
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
                Email:{" "}
                <Link href="mailto:vkramar.biz@gmail.com">
                  vkramar.biz@gmail.com
                </Link>
              </Typography>

            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </PageContainer>
  )
}