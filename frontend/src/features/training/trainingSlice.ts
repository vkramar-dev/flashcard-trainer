import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { trainingApi } from "../../api/trainingApi"
import type { CardData, CardSide, RequestStatus, StoredTrainingProgress } from "../../types"
import { clearTrainingProgress, writeTrainingProgress } from "./trainingStorage"

interface TrainingState {
  setId: number
  currentIndex: number
  currentCard: CardData
  side: CardSide
  pendingAnswer: boolean | null
  status: RequestStatus
  //saveStatus: RequestStatus
  error: string | null
  finished: boolean
  cards: CardData[]
}

const initialState: TrainingState = {
  setId: 0,
  currentIndex: 0,
  side: "front",
  pendingAnswer: null,
  status: "idle",
  error: null,
  finished: false,
  currentCard: {} as CardData,
  cards: [],
}

export const startTraining = createAsyncThunk<CardData[], number, { rejectValue: string }>(
  "training/start",
  async (setId, { rejectWithValue }) => {
    try {
      const cards = await trainingApi.start(setId)
      writeTrainingProgress({ setId, cards, currentIndex: 0 })

      if (cards.length === 0) {
        return rejectWithValue("This set has no cards yet. Add some cards before training.")
      }

      return cards
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not start training for this set."))
    }
  },
)

export const answer = createAsyncThunk<void, { cardId: number; isKnown: boolean }, { rejectValue: string }>(
  "training/answer",
  async ({ cardId, isKnown }, { rejectWithValue }) => {
    try {
      await trainingApi.answer(cardId, isKnown)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, `Could not answer the card ${cardId}.`))
    }
  },
)

const trainingSlice = createSlice({
  name: "training",
  initialState,
  reducers: {
    flipCard(state) {
      state.side = state.side === "front" ? "back" : "front"
    },
    /** Called when leaving the training page so stale card data is not reused. */
    resetTraining() {
      return initialState
    },
    abandonTraining() {
      clearTrainingProgress()
      return initialState
    },
    clearTrainingError(state) {
      state.error = null
    },
    restoreState(state, action: PayloadAction<StoredTrainingProgress>) {
      const data = action.payload
      state.setId = data.setId
      state.cards = data.cards
      state.currentIndex = data.currentIndex
      state.currentCard = data.cards[data.currentIndex]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startTraining.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.finished = false
      })
      .addCase(startTraining.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.setId = action.meta.arg
        state.cards = action.payload
        state.currentIndex = 0
        state.currentCard = action.payload[0]
        state.pendingAnswer = null
      })
      .addCase(startTraining.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not start training."
      })

      builder
      .addCase(answer.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.finished = false
      })
      .addCase(answer.fulfilled, (state) => {
        const index = state.currentIndex + 1
        state.status = "succeeded"
        state.currentIndex = index
        state.currentCard = state.cards[index]
        state.pendingAnswer = null
        if (index >= state.cards.length) {
          state.finished = true
          clearTrainingProgress()
        }
        else{
          writeTrainingProgress({ setId: state.setId, cards: state.cards, currentIndex: index })
        }
      })
      .addCase(answer.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not answer the card."
      })
    }
})

export const { flipCard, resetTraining, abandonTraining, clearTrainingError, restoreState } = trainingSlice.actions
export default trainingSlice.reducer
