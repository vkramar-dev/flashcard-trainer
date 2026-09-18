import { apiClient } from "./client"
import type { SetStatisticsModel } from "../types"

export const statisticsApi = {
  async getStatistics(): Promise<SetStatisticsModel[]> {
    const { data } = await apiClient.get<SetStatisticsModel[]>("/statistics/statistics")
    return data
  },
}
