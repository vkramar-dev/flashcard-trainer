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
  StorageUsageModel,
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
  notice: { key: string; count?: number } | null
  storage: StorageUsageModel | null
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
  storage: null,
}

export const loadAppStateAsync = createAsyncThunk<void, void, { rejectValue: string }>(
  "sets/loadAppState",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await appApi.getState()
      dispatch(initState(data.sets))
      dispatch(setSettings(data.settings))
      if (data.storage) {
        dispatch(setStorage(data.storage))
      }
      AppStorage.cacheScheme(data.settings.colorScheme as ColorSchemeName)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.loadAccount"))
    }
  },
)

export const fetchSetsAsync = createAsyncThunk<FullSetModel[], void, { rejectValue: string }>(
  "sets/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await setsApi.fetchAll()
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.loadSets"))
    }
  },
)

export const fetchSetAsync = createAsyncThunk<SetWithCardsModel, number, { rejectValue: string }>(
  "sets/fetchOne",
  async (setId, { rejectWithValue }) => {
    try {
      return await setsApi.fetchOne(setId)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.loadSet"))
    }
  },
)

export const createSetAsync = createAsyncThunk<FullSetModel, SetWithCardsModel, { rejectValue: string }>(
  "sets/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const created = await setsApi.create(payload)
      void dispatch(refreshStorageAsync())
      return created
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.createSet"))
    }
  },
)

export const updateSetAsync = createAsyncThunk<FullSetModel, SetWithCardsModel, { rejectValue: string }>(
  "sets/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const updated = await setsApi.create(payload)
      void dispatch(refreshStorageAsync())
      return updated
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.updateSet"))
    }
  },
)

export const deleteSetAsync = createAsyncThunk<void, number, { rejectValue: string }>(
  "sets/delete",
  async (setId, { dispatch, rejectWithValue }) => {
    try {
      await setsApi.delete(setId)
      void dispatch(refreshStorageAsync())
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.removeSet"))
    }
  },
)

export const importCardsAsync = createAsyncThunk<ImportResultModel, ImportPayload, { rejectValue: string }>(
  "sets/importCards",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const imported = await setsApi.importCards(payload)
      void dispatch(refreshStorageAsync())
      return imported
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.importCards"))
    }
  },
)

export const refreshStorageAsync = createAsyncThunk<StorageUsageModel, void, { rejectValue: string }>(
  "sets/refreshStorage",
  async (_, { rejectWithValue }) => {
    try {
      return await appApi.getStorage()
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.refreshStorage"))
    }
  },
)

export const exportSetAsync = createAsyncThunk<ExportDataModel, number, { rejectValue: string }>(
  "sets/export",
  async (setId, { rejectWithValue }) => {
    try {
      return await setsApi.exportSet(setId)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.exportSet"))
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
    setStorage(state, action: PayloadAction<StorageUsageModel>) {
      state.storage = action.payload
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
      state.storage = null
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
        state.error = action.payload ?? "errors.loadAccount"
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
        state.error = action.payload ?? "errors.loadSets"
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
        state.error = action.payload ?? "errors.loadSet"
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
        state.notice = { key: "notices.setSaved" }
      })
      .addCase(createSetAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "errors.createSet"
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
        state.notice = { key: "notices.changesSaved" }
      })
      .addCase(updateSetAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "errors.saveSet"
      })

      .addCase(deleteSetAsync.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(deleteSetAsync.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.items = state.items.filter((item) => item.id !== action.meta.arg)
        state.notice = { key: "notices.setRemoved" }
      })
      .addCase(deleteSetAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "errors.removeSet"
      })

      .addCase(importCardsAsync.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(importCardsAsync.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.items = upsertSummary(state.items, toSummary(action.payload.set))
        state.importSetId = null
        state.notice = { key: "notices.imported", count: action.payload.imported }
      })
      .addCase(importCardsAsync.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "errors.importCards"
      })

      .addCase(exportSetAsync.rejected, (state, action) => {
        state.saveError = action.payload ?? "errors.exportSet"
      })
      .addCase(refreshStorageAsync.fulfilled, (state, action) => {
        state.storage = action.payload
      })
  },
})

export const { clearSelectedSet, openImportDialog, closeImportDialog, clearSetsNotice, clearSetsError, setStorage, initState, markLastTrained, cleanSetsSlice } =
  setsSlice.actions
export default setsSlice.reducer
