import { apiClient } from "./client"
import type { AuthResponseModel, AuthModel } from "../types"

export const authApi = {
  async signUp(credentials: AuthModel): Promise<AuthResponseModel> {
    const { data } = await apiClient.post<AuthResponseModel>("/auth/register", credentials)
    return data
  },

  async signIn(credentials: AuthModel): Promise<AuthResponseModel> {
    const { data } = await apiClient.post<AuthResponseModel>("/auth/login", credentials)
    return data
  },

  async currentUser(): Promise<AuthResponseModel> {
    const { data } = await apiClient.get<AuthResponseModel>("/auth/me")
    return data
  },
}
