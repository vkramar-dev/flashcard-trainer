import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { toErrorMessage } from "../../api/client"
import { setsApi } from "../../api/setsApi"
import { trainingApi } from "../../api/trainingApi"
import type { CardData, CardModel, CardSide, RequestStatus, StoredTrainingProgress, TrainingRoundMode } from "../../types"
import { markLastTrained, refreshStorageAsync } from "../sets/setsSlice"
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
  /** "Don't know" answers from the round now on screen. Cleared when the next round starts. */
  mistakeIds: number[]
  mode: TrainingRoundMode
}

interface UpdateCardState {
  training: TrainingState
  auth: { user: { email: string } | null }
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
  mistakeIds: [],
  mode: "normal",
}

function shuffleCards<T>(cards: readonly T[]): T[] {
  const next = [...cards]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }
  return next
}

function withMistake(mistakeIds: number[], cardId: number, isKnown: boolean): number[] {
  if (isKnown || mistakeIds.includes(cardId)) return mistakeIds
  return [...mistakeIds, cardId]
}

export const startTrainingAsync = createAsyncThunk<CardData[], { userName: string; setId: number; shouldHide: boolean }, { rejectValue: string; }>(
  "training/start",
  async ({ userName, setId, shouldHide }, { dispatch, rejectWithValue }) => {
    try {
      const cards = await trainingApi.start(setId, shouldHide)

      if (cards.length === 0) {
        return rejectWithValue("errors.noCards")
      }

      AppStorage.setTrainingProgressNoException({
        userName,
        setId,
        cards,
        currentIndex: 0,
        mistakeIds: [],
        mode: "normal",
        finished: false,
      })

      dispatch(markLastTrained(setId))

      return cards
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.startTraining"))
    }
  },
)

export const updateTrainingCardAsync = createAsyncThunk<
  CardModel,
  { cardId: number; side: CardSide; text: string },
  { state: UpdateCardState; rejectValue: string }
>(
  "training/updateCard",
  async ({ cardId, side, text }, { dispatch, getState, rejectWithValue }) => {
    try {
      const updated = await setsApi.updateCardSide(cardId, side, text)
      void dispatch(refreshStorageAsync())
      const { training, auth } = getState()
      const userName = auth.user?.email
      if (userName) {
        AppStorage.setTrainingProgressNoException({
          userName,
          setId: training.setId,
          cards: training.cards.map((card) =>
            card.id === cardId ? { ...card, front: updated.front, back: updated.back ?? "" } : card,
          ),
          currentIndex: training.currentIndex,
          mistakeIds: training.mistakeIds,
          mode: training.mode,
          finished: training.finished,
        })
      }
      return updated
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.saveCard"))
    }
  },
)

export const answerAsync = createAsyncThunk<
  void,
  { cardId: number; isKnown: boolean },
  { state: UpdateCardState; rejectValue: string }
>(
  "training/answer",
  async ({ cardId, isKnown }, { getState, rejectWithValue }) => {
    try {
      await trainingApi.answer(cardId, isKnown)
      const { training, auth } = getState()
      const userName = auth.user?.email
      if (!userName) return

      const mistakeIds = withMistake(training.mistakeIds, cardId, isKnown)
      const nextIndex = training.currentIndex + 1
      const finished = nextIndex >= training.cards.length
      // A normal round with no mistakes keeps the previous behavior: refresh starts
      // a new session. A finished repeat stays put so refresh does not start one.
      if (finished && mistakeIds.length === 0 && training.mode === "normal") {
        AppStorage.clearTrainingProgress()
        return
      }

      AppStorage.setTrainingProgressNoException({
        userName,
        setId: training.setId,
        cards: training.cards,
        currentIndex: nextIndex,
        mistakeIds,
        mode: training.mode,
        finished,
      })
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "errors.answerCard"))
    }
  },
)

/** Next round is the current round's mistakes only. Does not start a server session. */
export const beginRepeatRound = createAsyncThunk<
  CardData[] | null,
  void,
  { state: UpdateCardState }
>(
  "training/beginRepeat",
  async (_, { getState }) => {
    const { training, auth } = getState()
    const cardsById = new Map(training.cards.map((card) => [card.id, card]))
    const seen = new Set<number>()
    const mistakes: CardData[] = []
    for (const cardId of training.mistakeIds) {
      if (seen.has(cardId)) continue
      seen.add(cardId)
      const card = cardsById.get(cardId)
      if (card) mistakes.push(card)
    }
    if (mistakes.length === 0) return null

    const cards = shuffleCards(mistakes)
    const userName = auth.user?.email
    if (userName) {
      AppStorage.setTrainingProgressNoException({
        userName,
        setId: training.setId,
        cards,
        currentIndex: 0,
        mistakeIds: [],
        mode: "repeat",
        finished: false,
      })
    }
    return cards
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
      const finished = data.finished === true
      state.setId = data.setId
      state.cards = data.cards
      state.currentIndex = data.currentIndex
      state.mistakeIds = Array.isArray(data.mistakeIds) ? data.mistakeIds : []
      state.mode = data.mode === "repeat" ? "repeat" : "normal"
      state.finished = finished
      state.side = "front"
      state.status = "succeeded"
      state.error = null
      state.currentCard = finished ? null : data.cards[data.currentIndex] ?? null
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
      state.mistakeIds = []
      state.mode = "normal"
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startTrainingAsync.pending, (state, action) => {
        state.setId = action.meta.arg.setId
        state.status = "loading"
        state.error = null
        state.finished = false
      })
      .addCase(startTrainingAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.cards = action.payload
        state.currentIndex = 0
        state.currentCard = action.payload[0]
        state.side = "front"
        state.mistakeIds = []
        state.mode = "normal"
        state.finished = false
      })
      .addCase(startTrainingAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "errors.startTraining"
      })

      builder
      .addCase(answerAsync.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.finished = false
      })
      .addCase(answerAsync.fulfilled, (state, action) => {
        const index = state.currentIndex + 1
        state.mistakeIds = withMistake(state.mistakeIds, action.meta.arg.cardId, action.meta.arg.isKnown)
        state.side = "front"
        state.status = "succeeded"
        state.currentIndex = index
        state.currentCard = state.cards[index] ?? null

        if (index >= state.cards.length) {
          state.finished = true
        }
      })
      .addCase(beginRepeatRound.fulfilled, (state, action) => {
        if (!action.payload) return
        state.cards = action.payload
        state.mistakeIds = []
        state.currentIndex = 0
        state.currentCard = action.payload[0] ?? null
        state.side = "front"
        state.finished = false
        state.mode = "repeat"
        state.status = "succeeded"
        state.error = null
      })
      .addCase(answerAsync.rejected, (state, action) => {
        state.status = state.cards.length > 0 ? "succeeded" : "failed"
        state.error = action.payload ?? "errors.answerCard"
      })
      .addCase(updateTrainingCardAsync.fulfilled, (state, action) => {
        const updated = action.payload
        if (updated.id == null) return
        const cardId = updated.id
        const front = updated.front
        const back = updated.back ?? ""
        state.cards = state.cards.map((card) =>
          card.id === cardId ? { ...card, front, back } : card,
        )
        if (state.currentCard?.id === cardId) {
          state.currentCard = { ...state.currentCard, front, back }
        }
      })
    }
})

export const { flipCard, resetTraining, clearTrainingError, restoreState, cleanTrainingSlice } = trainingSlice.actions
export default trainingSlice.reducer
