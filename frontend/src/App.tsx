import { Box } from "@mui/material"
import { useEffect } from "react"
import { AuthDialogs } from "./features/auth/AuthDialogs"
import { restoreSession } from "./features/auth/authSlice"
//import { fetchSettings } from "./features/settings/settingsSlice"
import { Header } from "./components/Header"
import { AppRoutes } from "./routes/AppRoutes"
import { useAppDispatch, useAppSelector } from "./store/hooks"
import { restoreState } from "./features/training/trainingSlice"
import { readTrainingProgress } from "./features/training/trainingStorage"
import { useNavigate } from "react-router-dom"

export default function App() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  // Settings live on the account, so they are only loaded once a session exists.
  useEffect(() => {
    if (!isAuthenticated) return
    //dispatch(fetchSettings())
    debugger;
    const trainingProgress = readTrainingProgress()
    if (trainingProgress) {
      dispatch(restoreState(trainingProgress))
      navigate(`/set/${trainingProgress.setId}/train`)
    }
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
