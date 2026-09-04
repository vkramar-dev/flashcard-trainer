import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material"
import { PageContainer } from "../components/PageContainer"

const features = [
  {
    title: "Sets",
    body: "Group cards into sets. Each tile on the home page shows how many of its cards you have already learnt, plus when the set was last modified and last used.",
  },
  {
    title: "Training",
    body: "Cards are shown one at a time. Tap a card to reveal the other side, mark whether you knew it, and continue. Every answer is saved before the next card appears, so closing the app mid-session loses nothing.",
  },
  {
    title: "Shuffle",
    body: "The pushpin on a set tile controls the card order. When it is pinned, the set is shuffled at the start of each session; when it is loose, cards keep the order you created them in.",
  },
  {
    title: "Import and export",
    body: "Cards can be imported from a CSV file with the front in the first column and the back in the second. Existing cards can either be kept or replaced. Exporting produces a CSV in the same format.",
  },
  {
    title: "Statistics",
    body: "See how many cards each set contains, how many are learnt, how often cards have been shown, and which cards you miss most often.",
  },
]

export default function AboutPage() {
  return (
    <PageContainer title="About" description="What Flashcard Trainer does and how the pieces fit together." maxWidth="md">
      <Stack gap={3}>
        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
              Learn by recall, not by rereading
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Flashcard Trainer is a spaced-repetition style trainer built around a single idea: you remember something
              far better when you try to retrieve it than when you read it again. Create sets of two-sided cards, train
              through them, and let the statistics show you where to put your attention next.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              How it works
            </Typography>
            <Stack divider={<Divider />} gap={2.5}>
              {features.map((feature) => (
                <Box key={feature.title}>
                  <Typography variant="subtitle1" component="h3" sx={{ mb: 0.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.body}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              A note on the backend
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This build talks to a mock REST API that keeps its data in a local JSON file. The API owns all learning
              logic: it decides card order, tracks how often each card has been shown, and calculates which cards are
              the hardest. The frontend only renders what the API reports, so swapping in a real backend needs no changes
              to the pages.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </PageContainer>
  )
}
