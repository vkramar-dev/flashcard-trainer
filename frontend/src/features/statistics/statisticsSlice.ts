import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { statisticsApi } from "../../api/statisticsApi"
import type { RequestStatus, SetStatisticsModel } from "../../types"

interface StatisticsState {
  /** Values come straight from the backend, including the hardest-card ranking. */
  bySet: SetStatisticsModel[]
  status: RequestStatus
  error: string | null
  /** Set to scroll to and highlight when arriving from a set menu. */
  highlightedSetId: number | null
}

const initialState: StatisticsState = {
  bySet: [],
  status: "idle",
  error: null,
  highlightedSetId: null,
}

export const fetchStatisticsAsync = createAsyncThunk<SetStatisticsModel[], void, { rejectValue: string }>(
  "statistics/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await statisticsApi.getStatistics()
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not load your statistics."))
    }
  },
)

const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    highlightSet(state, action: PayloadAction<number | null>) {
      state.highlightedSetId = action.payload
    },
    cleanStatisticsSlice(state) {
      state.bySet = []
      state.status = "idle"
      state.error = null
      state.highlightedSetId = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatisticsAsync.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchStatisticsAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.bySet = action.payload
      })
      .addCase(fetchStatisticsAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load your statistics."
      })
  },
})

export const { highlightSet, cleanStatisticsSlice } = statisticsSlice.actions
export default statisticsSlice.reducer
