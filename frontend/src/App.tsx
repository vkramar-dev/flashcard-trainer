import { Box } from "@mui/material"
import { useEffect } from "react"
import { AuthDialogs } from "./features/auth/AuthDialogs"
import { Header } from "./components/Header"
import { AppRoutes } from "./routes/AppRoutes"
import { useAppDispatch, useAppSelector } from "./store/hooks"
import { restoreState } from "./features/training/trainingSlice"
import { useNavigate } from "react-router-dom"
import { loadAppStateAsync } from "./features/sets/setsSlice"
import { restoreSessionAsync } from "./features/auth/authSlice"
import { AppStorage } from "./utils/AppStorage"

export default function App() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    void dispatch(restoreSessionAsync())
      .unwrap()
      .then((user) => {
        if (cancelled || !user) return

        const trainingProgress = AppStorage.getTrainingProgress()
        if (
          trainingProgress &&
          trainingProgress.userName === user.email &&
          trainingProgress.cards.length > 0
        ) {
          dispatch(restoreState(trainingProgress))
          navigate(`/set/${trainingProgress.setId}/train`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    void dispatch(loadAppStateAsync())
  }, [dispatch, isAuthenticated])

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Header />
      <Box component="main" sx={{ flex: 1, width: "100%" }}>
        <AppRoutes />
      </Box>
      <AuthDialogs />
    </Box>
  )
}

