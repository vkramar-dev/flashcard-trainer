import { Box } from "@mui/material"
import { useEffect } from "react"
import { AuthDialogs } from "./features/auth/AuthDialogs"
import { Header } from "./components/Header"
import { AppRoutes } from "./routes/AppRoutes"
import { useAppDispatch, useAppSelector } from "./store/hooks"
import { restoreState } from "./features/training/trainingSlice"
import { useNavigate } from "react-router-dom"
import { initState } from "./features/sets/setsSlice"
import { appApi } from "./api/appApi"
import { setSettings } from "./features/settings/settingsSlice"
import { restoreSession } from "./features/auth/authSlice"
import { AppStorage } from "./utils/AppStorage"
import { ColorSchemeName } from "./types"

export default function App() {
  const dispatch = useAppDispatch()
  const {isAuthenticated, user} = useAppSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(restoreSession())
    }
  }, [dispatch])

  useEffect(() => {
    if (!isAuthenticated) return
    
    appApi.getState().then((data) => {
      dispatch(initState(data.sets))
      dispatch(setSettings(data.settings))
      AppStorage.cacheScheme(data.settings.colorScheme as ColorSchemeName)
    })
    
    const trainingProgress = AppStorage.getTrainingProgress()
    if (trainingProgress && user && trainingProgress.userName === user.email) {
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

