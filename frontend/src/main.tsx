import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { store } from "./store"
import { ThemedApp } from "./theme/ThemedApp"

const container = document.getElementById("root")
if (!container) throw new Error("Root container not found")

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <ThemedApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemedApp>
    </Provider>
  </StrictMode>,
)
