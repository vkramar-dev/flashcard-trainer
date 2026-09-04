import { apiClient } from "./client"
import type { SetStatistics } from "../types"

export const statisticsApi = {
  async fetchAll(): Promise<SetStatistics[]> {
    const { data } = await apiClient.get<SetStatistics[]>("/statistics")
    return data
  },
}
