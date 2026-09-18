import { apiClient } from "./client"
import type { CardData, TrainingCard, TrainingResult } from "../types"

export const trainingApi = {

  async start(setId: number, shouldHide: boolean): Promise<CardData[]> {
    const { data } = await apiClient.get<CardData[]>(
      `/training/start?setId=${setId}&shouldHide=${shouldHide}`,
    );
    return data;
  },

  async answer(cardId: number, isKnown: boolean): Promise<void> {
    await apiClient.post("/training/answer", null, {
      params: { cardId, isKnown },
    });
  },

  async fetchCard(cardId: number): Promise<TrainingCard> {
    const { data } = await apiClient.get<TrainingCard>(
      `/training/cards/${cardId}`,
    );
    return data;
  },

  async saveResult(cardId: number, known: boolean): Promise<TrainingResult> {
    const { data } = await apiClient.post<TrainingResult>("/training/results", {
      cardId,
      known,
    });
    return data;
  },
};
