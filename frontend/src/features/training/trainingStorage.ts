import { StoredTrainingProgress } from "@/types"

const STORAGE_KEY = "flashcard-trainer.training"

export function readTrainingProgress(): StoredTrainingProgress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) return null

    return parsed as StoredTrainingProgress
  } catch {
    return null
  }
}

export function writeTrainingProgress(progress: StoredTrainingProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage may be unavailable - training still works for the current session.
  }
}

export function clearTrainingProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}
