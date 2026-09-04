import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { authApi } from "../../api/authApi"
import { readStoredToken, setAuthToken, toErrorMessage } from "../../api/client"
import type { AuthResponse, Credentials, RequestStatus } from "../../types"

export type AuthDialogView = "signIn" | "signUp" | null

interface AuthState {
  user: AuthResponse | null
  isAuthenticated: boolean
  status: RequestStatus
  error: string | null
  /** Which authentication dialog is currently open, if any. */
  dialog: AuthDialogView
  /** False until the stored session has been checked, so pages avoid a signed-out flash. */
  sessionChecked: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: "idle",
  error: null,
  dialog: null,
  sessionChecked: false,
}

export const signUp = createAsyncThunk<AuthResponse, Credentials, { rejectValue: string }>(
  "auth/signUp",
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authApi.signUp(credentials)
      setAuthToken(result.token)
      return result
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not create the account."))
    }
  },
)

export const signIn = createAsyncThunk<AuthResponse, Credentials, { rejectValue: string }>(
  "auth/signIn",
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authApi.signIn(credentials)
      setAuthToken(result.token)
      return result
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, "Could not sign in."))
    }
  },
)

export const signOut = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.signOut()
      setAuthToken(null)
    } catch (error) {
      setAuthToken(null)
      return rejectWithValue(toErrorMessage(error, "Could not sign out."))
    }
  },
)

/** Restores the session on application start when a token is already stored. */
export const restoreSession = createAsyncThunk<AuthResponse | null, void>("auth/restoreSession", async () => {
  if (!readStoredToken()) return null
  try {
    return await authApi.currentUser()
  } catch {
    setAuthToken(null)
    return null
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    openAuthDialog(state, action: PayloadAction<Exclude<AuthDialogView, null>>) {
      state.dialog = action.payload
      state.error = null
    },
    closeAuthDialog(state) {
      state.dialog = null
      state.error = null
      if (state.status === "loading") state.status = "idle"
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = action.payload !== null
        state.sessionChecked = true
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.sessionChecked = true
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.status = "idle"
      })
      .addCase(signOut.rejected, (state) => {
        // The token is cleared locally either way, so the UI treats this as signed out.
        state.user = null
        state.isAuthenticated = false
        state.status = "idle"
      })

    // signIn and signUp share identical state transitions.
    for (const thunk of [signIn, signUp]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = "loading"
          state.error = null
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.status = "succeeded"
          state.user = action.payload
          state.isAuthenticated = true
          state.dialog = null
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = "failed"
          state.error = action.payload ?? "Authentication failed."
        })
    }
  },
})

export const { openAuthDialog, closeAuthDialog, clearAuthError } = authSlice.actions
export default authSlice.reducer
