import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { setsApi } from "../../api/setsApi"
import { toErrorMessage } from "../../api/client"
import type {
  ExportData,
  ImportPayload,
  ImportResult,
  RequestStatus,
  SetDetail,
  SetPayload,
  SetSummary,
} from "../../types"

interface SetsState {
  items: SetSummary[]
  /** Full detail of the set currently being edited. */
  selectedSet: SetDetail | null
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

export const fetchSets = createAsyncThunk<SetSummary[], void, { rejectValue: string }>(
  "sets/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await setsApi.fetchAll()
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not load your flashcard sets."))
    }
  },
)

export const fetchSet = createAsyncThunk<SetDetail, number, { rejectValue: string }>(
  "sets/fetchOne",
  async (setId, { rejectWithValue }) => {
    try {
      return await setsApi.fetchOne(setId)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not load this flashcard set."))
    }
  },
)

export const createSet = createAsyncThunk<SetDetail, SetPayload, { rejectValue: string }>(
  "sets/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await setsApi.create(payload)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not create the set."))
    }
  },
)

export const updateSet = createAsyncThunk<SetDetail, { setId: number; payload: SetPayload }, { rejectValue: string }>(
  "sets/update",
  async ({ setId, payload }, { rejectWithValue }) => {
    try {
      return await setsApi.update(setId, payload)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not save the set."))
    }
  },
)

export const removeSet = createAsyncThunk<number, number, { rejectValue: string }>(
  "sets/remove",
  async (setId, { rejectWithValue }) => {
    try {
      await setsApi.remove(setId)
      return setId
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not remove the set."))
    }
  },
)

export const toggleShuffle = createAsyncThunk<SetSummary, { setId: number; shuffle: boolean }, { rejectValue: string }>(
  "sets/toggleShuffle",
  async ({ setId, shuffle }, { rejectWithValue }) => {
    try {
      return await setsApi.updateShuffle(setId, shuffle)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not update the shuffle setting."))
    }
  },
)

export const importCards = createAsyncThunk<ImportResult, ImportPayload, { rejectValue: string }>(
  "sets/importCards",
  async (payload, { rejectWithValue }) => {
    try {
      return await setsApi.importCards(payload)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not import the cards."))
    }
  },
)

export const exportSet = createAsyncThunk<ExportData, number, { rejectValue: string }>(
  "sets/export",
  async (setId, { rejectWithValue }) => {
    try {
      return await setsApi.exportSet(setId)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not export the set."))
    }
  },
)

function toSummary(detail: SetDetail): SetSummary {
  const { cards, ...summary } = detail
  void cards
  return summary
}

function upsertSummary(items: SetSummary[], summary: SetSummary): SetSummary[] {
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSets.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchSets.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload
      })
      .addCase(fetchSets.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load your flashcard sets."
      })

      .addCase(fetchSet.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.selectedSet = null
      })
      .addCase(fetchSet.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.selectedSet = action.payload
      })
      .addCase(fetchSet.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load this flashcard set."
      })

      .addCase(createSet.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(createSet.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.selectedSet = action.payload
        state.items = upsertSummary(state.items, toSummary(action.payload))
        state.notice = "Set created."
      })
      .addCase(createSet.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not create the set."
      })

      .addCase(updateSet.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(updateSet.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.selectedSet = action.payload
        state.items = upsertSummary(state.items, toSummary(action.payload))
        state.notice = "Changes saved."
      })
      .addCase(updateSet.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not save the set."
      })

      .addCase(removeSet.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(removeSet.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.notice = "Set removed."
      })
      .addCase(removeSet.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not remove the set."
      })

      .addCase(toggleShuffle.fulfilled, (state, action) => {
        state.items = upsertSummary(state.items, action.payload)
      })
      .addCase(toggleShuffle.rejected, (state, action) => {
        state.saveError = action.payload ?? "Could not update the shuffle setting."
      })

      .addCase(importCards.pending, (state) => {
        state.saveStatus = "loading"
        state.saveError = null
      })
      .addCase(importCards.fulfilled, (state, action) => {
        state.saveStatus = "succeeded"
        state.items = upsertSummary(state.items, toSummary(action.payload.set))
        state.importSetId = null
        state.notice = `Imported ${action.payload.imported} card${action.payload.imported === 1 ? "" : "s"}.`
      })
      .addCase(importCards.rejected, (state, action) => {
        state.saveStatus = "failed"
        state.saveError = action.payload ?? "Could not import the cards."
      })

      .addCase(exportSet.rejected, (state, action) => {
        state.saveError = action.payload ?? "Could not export the set."
      })
  },
})

export const { clearSelectedSet, openImportDialog, closeImportDialog, clearSetsNotice, clearSetsError } =
  setsSlice.actions
export default setsSlice.reducer
