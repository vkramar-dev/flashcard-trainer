import { Navigate, Route, Routes } from "react-router-dom"
import AboutPage from "../pages/AboutPage"
import EditSetPage from "../pages/EditSetPage"
import HomePage from "../pages/HomePage"
import SettingsPage from "../pages/SettingsPage"
import StatisticsPage from "../pages/StatisticsPage"
import TrainingPage from "../pages/TrainingPage"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/set/new" element={<EditSetPage />} />
      <Route path="/set/:setId/edit" element={<EditSetPage />} />
      <Route path="/set/:setId/train" element={<TrainingPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
