import { apiClient } from "./client"
import type { ColorSchemeName, UserSettings } from "../types"

export const settingsApi = {
  async fetch(): Promise<UserSettings> {
    const { data } = await apiClient.get<UserSettings>("/settings")
    return data
  },

  async update(colorScheme: ColorSchemeName): Promise<void> {
    await apiClient.put("/settings/scheme", null, { params: { scheme: colorScheme } })
  },
}
