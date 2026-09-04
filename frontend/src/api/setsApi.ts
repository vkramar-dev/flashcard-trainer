import { apiClient } from "./client"
import type { ExportData, ImportPayload, ImportResult, SetDetail, SetPayload, SetSummary } from "../types"

export const setsApi = {
  async fetchAll(): Promise<SetSummary[]> {
    const { data } = await apiClient.get<SetSummary[]>("/sets/sets")
    return data
  },

  async fetchOne(setId: number): Promise<SetDetail> {
    const { data } = await apiClient.get<SetDetail>(`/sets/${setId}`)
    return data
  },

  async create(payload: SetPayload): Promise<SetDetail> {
    const { data } = await apiClient.post<SetDetail>("/sets/create-or-update", payload)
    return data
  },

  async update(setId: number, payload: SetPayload): Promise<SetDetail> {
    const { data } = await apiClient.put<SetDetail>(`/sets/${setId}`, payload)
    return data
  },

  async remove(setId: number): Promise<void> {
    await apiClient.delete(`/sets/${setId}`)
  },

  async updateShuffle(setId: number, shuffle: boolean): Promise<SetSummary> {
    const { data } = await apiClient.patch<SetSummary>(`/sets/${setId}/shuffle`, { shuffle })
    return data
  },

  async importCards({ setId, mode, cards }: ImportPayload): Promise<ImportResult> {
    const { data } = await apiClient.post<ImportResult>(`/sets/${setId}/import`, { mode, cards })
    return data
  },

  async exportSet(setId: number): Promise<ExportData> {
    const { data } = await apiClient.get<ExportData>(`/sets/${setId}/export`)
    return data
  },
}
