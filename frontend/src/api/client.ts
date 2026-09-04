import axios from "axios"

/**
 * Single Axios instance used by the API service layer.
 * Presentation components never talk to Axios directly - only thunks do,
 * and only through the services in this folder.
 */
export const apiClient = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  baseURL: "https://localhost:7291/api",
  headers: { "Content-Type": "application/json" },
})

const TOKEN_STORAGE_KEY = "flashcard-trainer.token"

export function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable in private browsing modes - ignore.
  }
}

apiClient.interceptors.request.use((config) => {
  const token = readStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Turns any failure into a friendly message.
 * Raw JavaScript errors are never surfaced to the user.
 */
export function toErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message
    if (error.code === "ERR_NETWORK") return "Could not reach the server. Please check your connection."
  }
  return fallback
}
