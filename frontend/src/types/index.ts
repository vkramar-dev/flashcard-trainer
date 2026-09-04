/** Types mirroring the REST API contract. */

export interface AuthResponse {
  token: string
  email: string
}

export interface Credentials {
  email: string
  password: string
}

/** A card as returned inside a set detail response or edited on the Add/Edit page. */
export interface CardData {
  id: number
  front: string
  back: string
}

/** Tile representation on the Home page. */
export interface SetSummary {
  id: number
  name: string
  shuffle: boolean
  totalCards: number
  learntCards: number
  modified: string
  created: string | null
}

export interface SetDetail extends SetSummary {
  cards: CardData[]
}

/** Payload used for create/update: new cards have a null id. */
export interface CardPayload {
  id: number | null
  front: string
  back: string
}

export interface SetPayload {
  id: number | null
  name: string
  cards: CardPayload[]
}

export type ImportMode = "append" | "replace"

export interface ImportPayload {
  setId: number
  mode: ImportMode
  cards: Array<{ front: string; back: string }>
}

export interface ImportResult {
  imported: number
  set: SetDetail
}

export interface ExportData {
  name: string
  cards: Array<{ front: string; back: string }>
}

export interface TrainingSession {
  setId: number
  setName: string
  shuffle: boolean
  /** Ordered by the backend. The frontend must not reorder these. */
  cardIds: number[]
}

export interface TrainingCard {
  id: number
  setId: number
  front: string
  back: string
}

export interface TrainingResult {
  cardId: number
  known: boolean
  learnt: boolean
}

export interface HardestCard {
  id: number
  front: string
  back: string
  unknownCount: number
  shownCount: number
  /** Share of views answered with "I don't know", between 0 and 1. */
  missRate: number
}

/**
 * Training progress is persisted in localStorage so a refresh does not restart
 * the run. Exactly three values are stored: setId, cardIds and currentId.
 */
export interface StoredTrainingProgress {
  setId: number
  cards: CardData[]
  currentIndex: number
}

export interface SetStatistics {
  setId: number
  setName: string
  totalCards: number
  learntCards: number
  totalCardsShown: number
  hardestCards: HardestCard[]
}

export type ColorSchemeName = "default" | "blue" | "green" | "purple" | "dark"

export interface UserSettings {
  colorScheme: ColorSchemeName
  availableColorSchemes: ColorSchemeName[]
}

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed"

export type CardSide = "front" | "back"
