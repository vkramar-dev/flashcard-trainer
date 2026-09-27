import { apiClient } from "./client"
import type { CardData } from "../types"

export const trainingApi = {
  async start(setId: number, shouldHide: boolean): Promise<CardData[]> {
    const { data } = await apiClient.post<CardData[]>("/training/start", {
      setId,
      shouldHide,
    });
    return data;
  },
  
  async answer(cardId: number, isKnown: boolean): Promise<void> {
    await apiClient.post("/training/answer", {
      cardId,
      isKnown,
    });
  },
};
