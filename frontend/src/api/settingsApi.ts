import { apiClient } from "./client"
import type { ColorSchemeName } from "../types"

export const settingsApi = {
  async updateMaxCardsPerTrainingSession(maxCardsPerTrainingSession: number): Promise<void> {
    await apiClient.put("/settings/max-cards-per-training-session", null, { params: { maxCardsPerTrainingSession } })
  },
  async update(colorScheme: ColorSchemeName): Promise<void> {
    await apiClient.put("/settings/scheme", null, { params: { scheme: colorScheme } })
  },

    async updateHideKnownCards(hide: boolean): Promise<void> {
    await apiClient.put("/settings/hide-known-cards", null, { params: { hideKnownCards: hide } })
  },
}