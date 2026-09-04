import { apiClient } from "./client"
import type { AuthResponse, Credentials } from "../types"

export const authApi = {
  async signUp(credentials: Credentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", credentials)
    return data
  },

  async signIn(credentials: Credentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials)
    return data
  },

  async signOut(): Promise<void> {
    await apiClient.post("/auth/sign-out")
  },

  async currentUser(): Promise<AuthResponse> {
    const { data } = await apiClient.get<AuthResponse>("/auth/me")
    return data
  },
}
