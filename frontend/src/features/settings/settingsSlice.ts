import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { settingsApi } from "../../api/settingsApi"
import type { ColorSchemeName, RequestStatus, SettingsModel } from "../../types"
import { AppStorage } from "@/utils/AppStorage"

const KNOWN_SCHEMES: ColorSchemeName[] = ["graphite", "coastal", "porcelain", "mist", "slate", "espresso", "indigo", "midnight", "forest"]

/**
 * The scheme is cached locally so the correct theme paints on first render,
 * before the backend settings request resolves.
 */
function readCachedScheme(): ColorSchemeName {
  try {
    const value = AppStorage.getScheme()
    return KNOWN_SCHEMES.includes(value as ColorSchemeName) ? (value as ColorSchemeName) : "graphite"
  } catch {
    return "graphite"
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

export const updateColorSchemeAsync = createAsyncThunk<void, ColorSchemeName, { rejectValue: string }>(
  "settings/updateColorScheme",
  async (colorScheme, { rejectWithValue }) => {
    try {
      await settingsApi.update(colorScheme)
      AppStorage.cacheScheme(colorScheme)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not save your color scheme."))
    }
  },
)

export const updateHideKnownCardsAsync = createAsyncThunk<void, boolean, { rejectValue: string }>(
  "settings/updateHideKnownCards",
  async (hide, { rejectWithValue }) => {
    try {
      await settingsApi.updateHideKnownCards(hide)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not save your training preferences."))
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
      state.hideKnownCards = action.payload.hideKnownCards
    },
    cleanSettingsSlice(state) {
      state.availableColorSchemes = KNOWN_SCHEMES
      state.hideKnownCards = true
      state.status = "idle"
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateColorSchemeAsync.pending, (state, action) => {
        // Applied straight away so switching schemes feels instant.
        state.colorScheme = action.meta.arg
        state.error = null
      })
      .addCase(updateColorSchemeAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.colorScheme = action.meta.arg
        // state.availableColorSchemes = action.payload.availableColorSchemes
      })
      .addCase(updateColorSchemeAsync.rejected, (state, action) => {
        state.error = action.payload ?? "Could not save your color scheme."
      })

      .addCase(updateHideKnownCardsAsync.pending, (state) => {
        state.error = null
      })
      .addCase(updateHideKnownCardsAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.hideKnownCards = action.meta.arg
      })
      .addCase(updateHideKnownCardsAsync.rejected, (state, action) => {
        state.error = action.payload ?? "Could not save your settings."
      })
  },
})

export const { clearSettingsError, setSettings, cleanSettingsSlice } = settingsSlice.actions
export default settingsSlice.reducer
