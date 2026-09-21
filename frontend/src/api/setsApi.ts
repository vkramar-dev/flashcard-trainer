import { apiClient } from "./client"
import type { ExportDataModel, ImportPayload, ImportResultModel, SetWithCardsModel, FullSetModel } from "../types"

export const setsApi = {
  async fetchAll(): Promise<FullSetModel[]> {
    const { data } = await apiClient.get<FullSetModel[]>("/sets/sets")
    return data
  },

  async fetchOne(setId: number): Promise<SetWithCardsModel> {
    const { data } = await apiClient.get<SetWithCardsModel>(`/sets/set-with-cards?setId=${setId}`)
    return data
  },

  async create(set: SetWithCardsModel): Promise<FullSetModel> {
    const { data } = await apiClient.post<FullSetModel>("/sets/create-or-update", set)
    return data
  },

  async delete(setId: number): Promise<void> {
    await apiClient.delete(`/sets/${setId}`)
  },

  async updateShuffle(setId: number, shuffle: boolean): Promise<FullSetModel> {
    const { data } = await apiClient.patch<FullSetModel>(`/sets/${setId}/shuffle`, { shuffle })
    return data
  },

  async importCards({ setId, mode, cards }: ImportPayload): Promise<ImportResultModel> {
    const { data } = await apiClient.post<ImportResultModel>(
      `/sets/${setId}/import`, { append: mode === "append", cards })
    return data
  },

  async exportSet(setId: number): Promise<ExportDataModel> {
    const { data } = await apiClient.get<ExportDataModel>(`/sets/${setId}/export`)
    return data
  },
}
