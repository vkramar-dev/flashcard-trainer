import { apiClient } from "./client"
import type { AuthResponseModel, AuthModel, RegisterModel, SendRegistrationCodeResponse } from "../types"

export const authApi = {
  async sendRegistrationCode(email: string): Promise<SendRegistrationCodeResponse> {
    const { data } = await apiClient.post<SendRegistrationCodeResponse>("/auth/register/send-code", { email })
    return data
  },

  async signUp(credentials: RegisterModel): Promise<AuthResponseModel> {
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
