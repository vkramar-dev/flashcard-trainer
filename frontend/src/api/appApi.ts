import { apiClient } from "./client"
import type { AppStateModel, StorageUsageModel } from "../types"

export const appApi = {
  async getState(): Promise<AppStateModel> {
    const { data } = await apiClient.get<AppStateModel>("/app/state")
    return data
  },

  async getStorage(): Promise<StorageUsageModel> {
    const { data } = await apiClient.get<StorageUsageModel>("/app/storage")
    return data
  },
}
