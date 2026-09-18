import { apiClient } from "./client"
import type { ExportData, ImportPayload, ImportResult, SetWithCardsModel, SetModel } from "../types"

export const setsApi = {
  async fetchAll(): Promise<SetModel[]> {
    const { data } = await apiClient.get<SetModel[]>("/sets/sets")
    return data
  },

  async fetchOne(setId: number): Promise<SetWithCardsModel> {
    const { data } = await apiClient.get<SetWithCardsModel>(`/sets/set-with-cards?setId=${setId}`)
    return data
  },

  async create(set: SetWithCardsModel): Promise<SetModel> {
    const { data } = await apiClient.post<SetModel>("/sets/create-or-update", set)
    return data
  },

  // async update(setId: number, payload: SetWithCardsModel): Promise<SetDetail> {
  //   const { data } = await apiClient.put<SetDetail>(`/sets/${setId}`, payload)
  //   return data
  // },

  async delete(setId: number): Promise<void> {
    await apiClient.delete(`/sets/${setId}`)
  },

  async updateShuffle(setId: number, shuffle: boolean): Promise<SetModel> {
    const { data } = await apiClient.patch<SetModel>(`/sets/${setId}/shuffle`, { shuffle })
    return data
  },

  async importCards({ setId, mode, cards }: ImportPayload): Promise<ImportResult> {
    const { data } = await apiClient.post<ImportResult>(
      `/sets/${setId}/import`, { append: mode === "append", cards })
    return data
  },

  async exportSet(setId: number): Promise<ExportData> {
    const { data } = await apiClient.get<ExportData>(`/sets/${setId}/export`)
    return data
  },
}
