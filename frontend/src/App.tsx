import { Box } from "@mui/material"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { AuthDialogs } from "./features/auth/AuthDialogs"
import { Footer } from "./components/Footer"
import { Header } from "./components/Header"
import { AppRoutes } from "./routes/AppRoutes"
import { useAppDispatch, useAppSelector } from "./store/hooks"
import { resetTraining, restoreState } from "./features/training/trainingSlice"
import { useLocation, useNavigate } from "react-router-dom"
import { fetchSetsAsync, loadAppStateAsync } from "./features/sets/setsSlice"
import { restoreSessionAsync } from "./features/auth/authSlice"
import { AppStorage } from "./utils/AppStorage"

function isTrainingPath(pathname: string) {
  return /^\/set\/\d+\/train\/?$/.test(pathname)
}

export default function App() {
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation()
  const {isAuthenticated, user} = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const trainingMode = useAppSelector((state) => state.training.mode)
  const pathRef = useRef(location.pathname)

  useEffect(() => {
    document.title = t("app.documentTitle")
  }, [t, i18n.language])

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(restoreSessionAsync())
    }
  }, [dispatch])

  useEffect(() => {
    if (!isAuthenticated) return
    
    void dispatch(loadAppStateAsync())
    
    const trainingProgress = AppStorage.getTrainingProgress()
    if (trainingProgress && user && trainingProgress.userName === user.email) {
      dispatch(restoreState(trainingProgress))
      navigate(`/set/${trainingProgress.setId}/train`)
    }
  }, [dispatch, isAuthenticated])

  // Refresh on the training page still resumes. Opening any other page ends
  // the session, same as End session, and reloads learnt counts.
  useEffect(() => {
    const previous = pathRef.current
    pathRef.current = location.pathname
    if (!isTrainingPath(previous) || isTrainingPath(location.pathname)) return

    AppStorage.clearTrainingProgress()
    if (trainingMode === "repeat") dispatch(resetTraining())
    if (isAuthenticated) void dispatch(fetchSetsAsync())
  }, [dispatch, isAuthenticated, location.pathname, trainingMode])

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Header />
      <Box component="main" sx={{ flex: 1, width: "100%" }}>
        <AppRoutes />
      </Box>
      <Footer />
      <AuthDialogs />
    </Box>
  )
}

