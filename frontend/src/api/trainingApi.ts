import { apiClient } from "./client"
import type { CardData } from "../types"

export const trainingApi = {
  async start(setId: number, shouldHide: boolean): Promise<CardData[]> {
    const { data } = await apiClient.get<CardData[]>(
      `/training/start?setId=${setId}&shouldHide=${shouldHide}`,
    );
    return data;
  },
  
  async answer(cardId: number, isKnown: boolean): Promise<void> {
    await apiClient.post("/training/answer", {
      cardId,
      isKnown,
    });
  },
};
