/** Types mirroring the REST API contract. */

export interface AuthResponse {
  token: string
  email: string
}

export interface LoginModel {
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
export interface SetModel {
  id: number
  name: string
  shuffle: boolean
  totalCards: number
  learntCards: number
  created: string
  modified: string
}

export interface SetDetail extends SetModel {
  cards: CardData[]
}

/** Payload used for create/update: new cards have a null id. */
export interface CardModel {
  id: number | null
  front: string
  back: string
}

export interface SetWithCardsModel {
  id: number | null
  name: string
  cards: CardModel[]
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

export interface FullCardModel {
  id: number
  front: string
  back: string
  unknownCount: number
  shownCount: number
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

export interface SetStatisticsModel {
  setId: number
  setName: string
  totalCards: number
  learntCards: number
  totalCardsShown: number
  hardestCards: FullCardModel[]
}

export interface SettingsModel {
  colorScheme: string
  hideKnownCards: boolean
}

export interface AppStateModel {
  sets: SetModel[]
  userName: string
  settings: SettingsModel
}

export type ColorSchemeName = "coastal" | "porcelain" | "mist" | "slate" | "espresso" | "graphite" | "indigo" | "midnight" | "forest"

export interface UserSettings {
  colorScheme: ColorSchemeName
  availableColorSchemes: ColorSchemeName[]
}

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed"

export type CardSide = "front" | "back"
