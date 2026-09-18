import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { settingsApi } from "../../api/settingsApi"
import type { ColorSchemeName, RequestStatus, SettingsModel } from "../../types"

const SCHEME_STORAGE_KEY = "flashcard-trainer.colorScheme"
const KNOWN_SCHEMES: ColorSchemeName[] = ["graphite", "coastal", "porcelain", "mist", "slate", "espresso", "indigo", "midnight", "forest"]

/**
 * The scheme is cached locally so the correct theme paints on first render,
 * before the backend settings request resolves.
 */
function readCachedScheme(): ColorSchemeName {
  try {
    const value = window.localStorage.getItem(SCHEME_STORAGE_KEY)
    return KNOWN_SCHEMES.includes(value as ColorSchemeName) ? (value as ColorSchemeName) : "graphite"
  } catch {
    return "graphite"
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
  hideKnownCards: boolean
  status: RequestStatus
  error: string | null
}

const initialState: SettingsState = {
  colorScheme: readCachedScheme(),
  availableColorSchemes: KNOWN_SCHEMES,
  hideKnownCards: true,
  status: "idle",
  error: null,
}

export const updateColorScheme = createAsyncThunk<void, ColorSchemeName, { rejectValue: string }>(
  "settings/updateColorScheme",
  async (colorScheme, { rejectWithValue }) => {
    try {
      await settingsApi.update(colorScheme)
      cacheScheme(colorScheme)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not save your color scheme."))
    }
  },
)

export const updateHideKnownCards = createAsyncThunk<void, boolean, { rejectValue: string }>(
  "settings/updateHideKnownCards",
  async (hide, { rejectWithValue }) => {
    try {
      await settingsApi.updateHideKnownCards(hide)
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
    setSettings(state, action: PayloadAction<SettingsModel>) {
      const scheme = action.payload.colorScheme as ColorSchemeName
      state.colorScheme = scheme
      cacheScheme(scheme)
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateColorScheme.pending, (state, action) => {
        // Applied straight away so switching schemes feels instant.
        state.colorScheme = action.meta.arg
        state.error = null
      })
      .addCase(updateColorScheme.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.colorScheme = action.meta.arg
        // state.availableColorSchemes = action.payload.availableColorSchemes
      })
      .addCase(updateColorScheme.rejected, (state, action) => {
        state.error = action.payload ?? "Could not save your color scheme."
      })

      .addCase(updateHideKnownCards.pending, (state) => {
        state.error = null
      })
      .addCase(updateHideKnownCards.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.hideKnownCards = action.meta.arg
      })
      .addCase(updateHideKnownCards.rejected, (state, action) => {
        state.error = action.payload ?? "Could not save your settings."
      })
  },
})

export const { clearSettingsError, setSettings } = settingsSlice.actions
export default settingsSlice.reducer
