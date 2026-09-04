import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../features/auth/authSlice"
import setsReducer from "../features/sets/setsSlice"
import settingsReducer from "../features/settings/settingsSlice"
import statisticsReducer from "../features/statistics/statisticsSlice"
import trainingReducer from "../features/training/trainingSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sets: setsReducer,
    training: trainingReducer,
    statistics: statisticsReducer,
    settings: settingsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
