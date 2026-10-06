import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { appApi } from "../../api/appApi"
import { setsApi } from "../../api/setsApi"
import { toErrorMessage } from "../../api/client"
import { setSettings } from "../settings/settingsSlice"
import { AppStorage } from "@/utils/AppStorage"
import type {
  ColorSchemeName,
  ExportDataModel,
  ImportPayload,
  ImportResultModel,
  RequestStatus,
  SetDetail,
  SetWithCardsModel,
  FullSetModel,
} from "../../types"

interface SetsState {
  items: FullSetModel[]
  /** Full detail of the set currently being edited. */
  selectedSet: SetWithCardsModel | null
  status: RequestStatus
  error: string | null
  /** Status of create/update/delete/shuffle/import operations. */
  saveStatus: RequestStatus
  saveError: string | null
  /** Id of the set whose import dialog is open, if any. */
  importSetId: number | null
  notice: string | null
}

const initialState: SetsState = {
  items: [],
  selectedSet: null,
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
  importSetId: null,
  notice: null,
}

export const loadAppStateAsync = createAsyncThunk<void, void, { rejectValue: string }>(
  "sets/loadAppState",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await appApi.getState()
      dispatch(initState(data.sets))
      dispatch(setSettings(data.settings))
      AppStorage.cacheScheme(data.settings.colorScheme as ColorSchemeName)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not load your account."))
    }
  },
)

export const fetchSetsAsync = createAsyncThunk<FullSetModel[], void, { rejectValue: string }>(
  "sets/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await setsApi.fetchAll()
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not load your flashcard sets."))
    }
  },
)

export const fetchSetAsync = createAsyncThunk<SetWithCardsModel, number, { rejectValue: string }>(
  "sets/fetchOne",
  async (setId, { rejectWithValue }) => {
    try {
      return await setsApi.fetchOne(setId)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not load this flashcard set."))
    }
  },
)

export const createSetAsync = createAsyncThunk<FullSetModel, SetWithCardsModel, { rejectValue: string }>(
  "sets/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await setsApi.create(payload)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not create the set."))
    }
  },
)

export const updateSetAsync = createAsyncThunk<FullSetModel, SetWithCardsModel, { rejectValue: string }>(
  "sets/update",
  async (payload, { rejectWithValue }) => {
    try {
      return await setsApi.create(payload)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not update the set."))
    }
  },
)

export const deleteSetAsync = createAsyncThunk<void, number, { rejectValue: string }>(
  "sets/delete",
  async (setId, { rejectWithValue }) => {
    try {
      await setsApi.delete(setId)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not remove the set."))
    }
  },
)

export const toggleShuffleAsync = createAsyncThunk<void, { setId: number; shuffle: boolean }, { rejectValue: string }>(
  "sets/toggleShuffle",
  async ({ setId, shuffle }, { rejectWithValue }) => {
    try {
      await setsApi.updateShuffle(setId, shuffle)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not update the shuffle setting."))
    }
  },
)

export const importCardsAsync = createAsyncThunk<ImportResultModel, ImportPayload, { rejectValue: string }>(
  "sets/importCards",
  async (payload, { rejectWithValue }) => {
    try {
      return await setsApi.importCards(payload)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not import the cards."))
    }
  },
)

export const exportSetAsync = createAsyncThunk<ExportDataModel, number, { rejectValue: string }>(
  "sets/export",
  async (setId, { rejectWithValue }) => {
    try {
      return await setsApi.exportSet(setId)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not export the set."))
    }
  },
)

function toSummary(detail: SetDetail): FullSetModel {
  const { cards, ...summary } = detail
  void cards
  return summary
}

function upsertSummary(items: FullSetModel[], summary: FullSetModel): FullSetModel[] {
  const index = items.findIndex((item) => item.id === summary.id)
  if (index === -1) return [...items, summary]
  const next = items.slice()
  next[index] = summary
  return next
}

const setsSlice = createSlice({
  name: "sets",
  initialState,
  reducers: {
    clearSelectedSet(state) {
      state.selectedSet = null
      state.saveStatus = "idle"
      state.saveError = null
    },
    openImportDialog(state, action: PayloadAction<number>) {
      state.importSetId = action.payload
      state.saveError = null
    },
    closeImportDialog(state) {
      state.importSetId = null
      state.saveError = null
    },
    clearSetsNotice(state) {
      state.notice = null
    },
    clearSetsError(state) {
      state.error = null
      state.saveError = null
    },
    initState(state, action: PayloadAction<FullSetModel[]>) {
      state.items = action.payload
      state.selectedSet = null
      state.importSetId = null
      state.notice = null
      state.status = "succeeded"
      state.error = null
      state.saveStatus = "idle"
      state.saveError = null
    },
    markLastTrained(state, action: PayloadAction<number>) {
      const item = state.items.find((set) => set.id === action.payload)
      if (item) {
        item.lastTrained = new Date().toISOString()
      }
    },
    cleanSetsSlice(state) {
      state.items = []
      state.selectedSet = null
      state.importSetId = null
      state.notice = null
      state.status = "idle"
      state.error = null
      state.saveStatus = "idle"
      state.saveError = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAppStateAsync.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loadAppStateAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load your account."
      })
      .addCase(fetchSetsAsync.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchSetsAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload
      })
      .addCase(fetchSetsAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load your flashcard sets."
      })

      .addCase(fetchSetAsync.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.selectedSet = null
      })
      .addCase(fetchSetAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.selectedSet = action.payload
      })
      .addCase(fetchSetAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load this flashcard set."
      })

      .addCase(createSetAsync.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(createSetAsync.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.selectedSet = null
        let isFound = false
        for (let i = 0; i < state.items.length; i++) {
          if (state.items[i].id === action.payload.id) {
            state.items[i] = action.payload
            isFound = true
            break
          }
        }
        if (!isFound) {
          state.items = state.items.concat(action.payload)
        }
        state.notice = "Set saved."
      })
      .addCase(createSetAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not create the set."
      })

      .addCase(updateSetAsync.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(updateSetAsync.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.selectedSet = null

        let isFound = false
        for (let i = 0; i < state.items.length; i++) {
          if (state.items[i].id === action.payload.id) {
            state.items[i] = action.payload
            isFound = true
            break
          }
        }
        if (!isFound) {
          state.items = state.items.concat(action.payload)
        }
        state.notice = "Changes saved."
      })
      .addCase(updateSetAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not save the set."
      })

      .addCase(deleteSetAsync.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(deleteSetAsync.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.items = state.items.filter((item) => item.id !== action.meta.arg)
        state.notice = "Set removed."
      })
      .addCase(deleteSetAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not remove the set."
      })

      .addCase(toggleShuffleAsync.fulfilled, (state, action) => {
        const item = state.items.find((set) => set.id === action.meta.arg.setId)
        if (item) {
          item.shuffle = action.meta.arg.shuffle
        }
      })
      .addCase(toggleShuffleAsync.rejected, (state, action) => {
        state.saveError = action.payload ?? "Could not update the shuffle setting."
      })

      .addCase(importCardsAsync.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(importCardsAsync.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.items = upsertSummary(state.items, toSummary(action.payload.set))
        state.importSetId = null
        state.notice = `Imported ${action.payload.imported} card${action.payload.imported === 1 ? "" : "s"}.`
      })
      .addCase(importCardsAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not import the cards."
      })

      .addCase(exportSetAsync.rejected, (state, action) => {
        state.saveError = action.payload ?? "Could not export the set."
      })
  },
})

export const { clearSelectedSet, openImportDialog, closeImportDialog, clearSetsNotice, clearSetsError, initState, markLastTrained, cleanSetsSlice } =
  setsSlice.actions
export default setsSlice.reducer
