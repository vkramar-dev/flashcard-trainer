import { apiClient } from "./client"
import type { AppStateModel } from "../types"

export const appApi = {
  async getState(): Promise<AppStateModel> {
    const { data } = await apiClient.get<AppStateModel>("/app/state")
    return data
  },
}
