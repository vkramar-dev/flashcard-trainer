import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { settingsApi } from "../../api/settingsApi"
import type { ColorSchemeName, RequestStatus, UserSettings } from "../../types"

const SCHEME_STORAGE_KEY = "flashcard-trainer.colorScheme"
const KNOWN_SCHEMES: ColorSchemeName[] = ["default", "blue", "green", "purple", "dark"]

/**
 * The scheme is cached locally so the correct theme paints on first render,
 * before the backend settings request resolves.
 */
function readCachedScheme(): ColorSchemeName {
  try {
    const value = window.localStorage.getItem(SCHEME_STORAGE_KEY)
    return KNOWN_SCHEMES.includes(value as ColorSchemeName) ? (value as ColorSchemeName) : "default"
  } catch {
    return "default"
  }
}

function cacheScheme(scheme: ColorSchemeName): void {
  try {
    window.localStorage.setItem(SCHEME_STORAGE_KEY, scheme)
  } catch {
    // Ignore storage failures - the backend remains the source of truth.
  }
}

interface SettingsState {
  colorScheme: ColorSchemeName
  availableColorSchemes: ColorSchemeName[]
  status: RequestStatus
  error: string | null
}

const initialState: SettingsState = {
  colorScheme: readCachedScheme(),
  availableColorSchemes: KNOWN_SCHEMES,
  status: "idle",
  error: null,
}

export const fetchSettings = createAsyncThunk<UserSettings, void, { rejectValue: string }>(
  "settings/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await settingsApi.fetch()
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not load your settings."))
    }
  },
)

export const updateColorScheme = createAsyncThunk<UserSettings, ColorSchemeName, { rejectValue: string }>(
  "settings/updateColorScheme",
  async (colorScheme, { rejectWithValue }) => {
    try {
      const settings = await settingsApi.update(colorScheme)
      cacheScheme(settings.colorScheme)
      return settings
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not save your color scheme."))
    }
  },
)

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearSettingsError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.colorScheme = action.payload.colorScheme
        state.availableColorSchemes = action.payload.availableColorSchemes
        cacheScheme(action.payload.colorScheme)
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load your settings."
      })

      .addCase(updateColorScheme.pending, (state, action) => {
        // Applied straight away so switching schemes feels instant.
        state.colorScheme = action.meta.arg
        state.error = null
      })
      .addCase(updateColorScheme.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.colorScheme = action.payload.colorScheme
        state.availableColorSchemes = action.payload.availableColorSchemes
      })
      .addCase(updateColorScheme.rejected, (state, action) => {
        state.error = action.payload ?? "Could not save your color scheme."
      })
  },
})

export const { clearSettingsError } = settingsSlice.actions
export default settingsSlice.reducer
