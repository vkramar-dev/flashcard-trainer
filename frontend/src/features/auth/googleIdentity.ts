/** Small typed wrapper around the official Google Identity Services browser library. */
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client"

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdentityApi {
  initialize(options: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    ux_mode?: "popup"
  }): void
  renderButton(element: HTMLElement, options: {
    type: "standard"
    theme: "outline" | "filled_black"
    size: "large"
    shape: "rectangular" | "pill"
    text: "continue_with"
    logo_alignment?: "left" | "center"
    width?: number
    locale: string
  }): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } }
  }
}

let scriptPromise: Promise<void> | null = null
let initializedClientId: string | null = null
let credentialHandler: ((credential: string) => void) | null = null

/** Loads GIS once, even if a dialog is opened and closed repeatedly. */
export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const previous = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`)
    const script = previous ?? document.createElement("script")

    const loaded = () => {
      cleanup()
      if (window.google?.accounts.id) resolve()
      else {
        script.remove()
        reject(new Error("Google Identity Services did not initialize."))
      }
    }
    const failed = () => {
      cleanup()
      script.remove() // A later dialog opening can attempt a fresh load.
      reject(new Error("Could not load Google Identity Services."))
    }
    const cleanup = () => {
      script.removeEventListener("load", loaded)
      script.removeEventListener("error", failed)
    }

    script.addEventListener("load", loaded)
    script.addEventListener("error", failed)
    if (!previous) {
      script.src = GOOGLE_SCRIPT_URL
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }).catch((error: unknown) => {
    scriptPromise = null // Allow retry if network/script loading fails.
    throw error
  })

  return scriptPromise
}

/** Google's callback is global to this page, so we initialize it exactly once. */
export function initializeGoogleIdentity(clientId: string): GoogleIdentityApi {
  const api = window.google?.accounts.id
  if (!api) throw new Error("Google Identity Services unavailable.")

  if (initializedClientId && initializedClientId !== clientId) {
    throw new Error("Google Identity Services already initialized with another client ID.")
  }
  if (!initializedClientId) {
    api.initialize({
      client_id: clientId,
      ux_mode: "popup",
      auto_select: false,
      callback: (response) => {
        if (response.credential) credentialHandler?.(response.credential)
      },
    })
    initializedClientId = clientId
  }
  return api
}

/** Only one Google button is mounted at a time (sign-in dialog OR account settings). */
export function registerGoogleCredentialHandler(handler: (credential: string) => void): () => void {
  credentialHandler = handler
  return () => {
    if (credentialHandler === handler) credentialHandler = null
  }
}
