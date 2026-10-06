import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { trainingApi } from "../../api/trainingApi"
import type { CardData, CardSide, RequestStatus, StoredTrainingProgress } from "../../types"
import { markLastTrained } from "../sets/setsSlice"
import { AppStorage } from "@/utils/AppStorage"

interface TrainingState {
  setId: number
  currentIndex: number
  currentCard: CardData | null
  side: CardSide
  status: RequestStatus
  error: string | null
  finished: boolean
  cards: CardData[]
}

const initialState: TrainingState = {
  setId: 0,
  currentIndex: 0,
  side: "front",
  status: "idle",
  error: null,
  finished: false,
  currentCard: null,
  cards: [],
}

export const startTrainingAsync = createAsyncThunk<CardData[], { userName: string; setId: number; shouldHide: boolean }, { rejectValue: string; }>(
  "training/start",
  async ({ userName, setId, shouldHide }, { dispatch, rejectWithValue }) => {
    try {
      const cards = await trainingApi.start(setId, shouldHide)

      AppStorage.setTrainingProgressNoException({
                    userName,
                    setId,
                    cards,
                    currentIndex: 0,
                  });

      if (cards.length === 0) {
        return rejectWithValue("This set has no cards yet. Add some cards before training.")
      }

      dispatch(markLastTrained(setId))

      return cards
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not start training for this set."))
    }
  },
)

export const answerAsync = createAsyncThunk<void, { cardId: number; isKnown: boolean }, { rejectValue: string }>(
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
    cleanTrainingSlice(state) {
      state.setId = 0
      state.currentIndex = 0
      state.side = "front"
      state.status = "idle"
      state.error = null
      state.finished = false
      state.currentCard = null
      state.cards = []
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startTrainingAsync.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.finished = false
      })
      .addCase(startTrainingAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.setId = action.meta.arg.setId
        state.cards = action.payload
        state.currentIndex = 0
        state.currentCard = action.payload[0]
        state.side = "front"
      })
      .addCase(startTrainingAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not start training."
      })

      builder
      .addCase(answerAsync.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.finished = false
      })
      .addCase(answerAsync.fulfilled, (state) => {
        const index = state.currentIndex + 1
        state.side = "front"
        state.status = "succeeded"
        state.currentIndex = index
        state.currentCard = state.cards[index]

        if (index >= state.cards.length) {
          state.finished = true
        }
      })
      .addCase(answerAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Could not answer the card."
      })
    }
})

export const { flipCard, resetTraining, clearTrainingError, restoreState, cleanTrainingSlice } = trainingSlice.actions
export default trainingSlice.reducer
