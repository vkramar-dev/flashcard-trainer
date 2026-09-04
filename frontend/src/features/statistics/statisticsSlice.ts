import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { statisticsApi } from "../../api/statisticsApi"
import type { RequestStatus, SetStatistics } from "../../types"

interface StatisticsState {
  /** Values come straight from the backend, including the hardest-card ranking. */
  bySet: SetStatistics[]
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

export const fetchStatistics = createAsyncThunk<SetStatistics[], void, { rejectValue: string }>(
  "statistics/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await statisticsApi.fetchAll()
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatistics.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.bySet = action.payload
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not load your statistics."
      })
  },
})

export const { highlightSet } = statisticsSlice.actions
export default statisticsSlice.reducer
