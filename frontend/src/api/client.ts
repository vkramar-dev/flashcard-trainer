import axios from "axios"
import type { RegistrationFailure } from "../types"
import { AppStorage } from "@/utils/AppStorage"

/**
 * Single Axios instance used by the API service layer.
 * Presentation components never talk to Axios directly - only thunks do,
 * and only through the services in this folder.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  const token = AppStorage.getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Turns any failure into a friendly message.
 * Raw JavaScript errors are never surfaced to the user.
 */
export function readRegistrationFailure(error: unknown, fallback: string): RegistrationFailure {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { code?: unknown; message?: unknown; attemptsRemaining?: unknown }
      | undefined

    if (data && typeof data.message === "string" && data.message) {
      return {
        code: typeof data.code === "string" ? data.code : "Unknown",
        message: data.message,
        attemptsRemaining: typeof data.attemptsRemaining === "number" ? data.attemptsRemaining : null,
      }
    }

    if (error.code === "ERR_NETWORK") {
      return {
        code: "Network",
        message: "Could not reach the server. Please check your connection.",
        attemptsRemaining: null,
      }
    }
  }

  return { code: "Unknown", message: fallback, attemptsRemaining: null }
}

export function toErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message
    if (error.code === "ERR_NETWORK") return "Could not reach the server. Please check your connection."
  }
  return fallback
}
