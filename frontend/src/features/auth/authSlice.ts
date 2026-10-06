import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { authApi } from "../../api/authApi";
import { readRegistrationFailure, toErrorMessage } from "../../api/client";
import type {
  AuthResponseModel,
  AuthModel,
  RegisterModel,
  RegistrationFailure,
  RequestStatus,
} from "../../types";
import { AppStorage } from "@/utils/AppStorage";

export type AuthDialogView = "signIn" | "signUp" | null;

interface AuthState {
  user: AuthResponseModel | null;
  isAuthenticated: boolean;
  status: RequestStatus;
  error: string | null;
  registrationFailure: RegistrationFailure | null;
  /** Which authentication dialog is currently open, if any. */
  dialog: AuthDialogView;
  /** False until the stored session has been checked, so pages avoid a signed-out flash. */
  sessionChecked: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: "idle",
  error: null,
  registrationFailure: null,
  dialog: null,
  sessionChecked: false,
};

export const sendRegistrationCodeAsync = createAsyncThunk<
  SendRegistrationCodeResult,
  string,
  { rejectValue: RegistrationFailure }
>("auth/sendRegistrationCode", async (email, { rejectWithValue }) => {
  try {
    return await authApi.sendRegistrationCode(email);
  } catch (error) {
    return rejectWithValue(
      readRegistrationFailure(error, "Could not send the verification email."),
    );
  }
});

export const signUpAsync = createAsyncThunk<
  AuthResponseModel,
  RegisterModel,
  { rejectValue: RegistrationFailure }
>("auth/signUp", async (credentials, { rejectWithValue }) => {
  try {
    const result = await authApi.signUp(credentials);
    AppStorage.setAuthToken(result.token);
    return result;
  } catch (error) {
    return rejectWithValue(
      readRegistrationFailure(error, "Could not create the account."),
    );
  }
});

export const signInAsync = createAsyncThunk<
  AuthResponseModel,
  AuthModel,
  { rejectValue: string }
>("auth/signIn", async (credentials, { rejectWithValue }) => {
  try {
    const result = await authApi.signIn(credentials);
    AppStorage.setAuthToken(result.token);
    return result;
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, "Could not sign in."));
  }
});

export const restoreSessionAsync = createAsyncThunk<AuthResponseModel | null, void>(
  "auth/restoreSession",
  async () => {
    if (!AppStorage.getAuthToken()) return null;

    try {
      return await authApi.currentUser();
    } catch {
      AppStorage.setAuthToken(null);
      return null;
    }
  },
);

interface SendRegistrationCodeResult {
  codeExpAt: string;
}

function applyRegistrationFailure(
  state: AuthState,
  failure: RegistrationFailure | undefined,
  fallback: string,
) {
  state.status = "failed";
  state.registrationFailure = failure ?? {
    code: "Unknown",
    message: fallback,
    attemptsRemaining: null,
  };
  state.error = state.registrationFailure.message;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    openAuthDialog(
      state,
      action: PayloadAction<Exclude<AuthDialogView, null>>,
    ) {
      state.dialog = action.payload;
      state.error = null;
      state.registrationFailure = null;
    },
    closeAuthDialog(state) {
      state.dialog = null;
      state.error = null;
      state.registrationFailure = null;
      if (state.status === "loading") state.status = "idle";
    },
    clearAuthError(state) {
      state.error = null;
      state.registrationFailure = null;
    },
    signOut(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.dialog = null;
      state.error = null;
      state.registrationFailure = null;
      if (state.status === "loading") state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSessionAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = action.payload !== null;
        state.sessionChecked = true;
      })
      .addCase(restoreSessionAsync.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.sessionChecked = true;
      })
      .addCase(sendRegistrationCodeAsync.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.registrationFailure = null;
      })
      .addCase(sendRegistrationCodeAsync.fulfilled, (state) => {
        state.status = "idle";
        state.error = null;
        state.registrationFailure = null;
      })
      .addCase(sendRegistrationCodeAsync.rejected, (state, action) => {
        applyRegistrationFailure(
          state,
          action.payload,
          "Could not send the verification email.",
        );
      })
      .addCase(signInAsync.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.registrationFailure = null;
      })
      .addCase(signInAsync.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.dialog = null;
        state.registrationFailure = null;
      })
      .addCase(signInAsync.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Authentication failed.";
        state.registrationFailure = null;
      })
      .addCase(signUpAsync.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.registrationFailure = null;
      })
      .addCase(signUpAsync.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.dialog = null;
        state.registrationFailure = null;
      })
      .addCase(signUpAsync.rejected, (state, action) => {
        applyRegistrationFailure(
          state,
          action.payload,
          "Could not create the account.",
        );
      });
  },
});

export const { openAuthDialog, closeAuthDialog, clearAuthError, signOut } =
  authSlice.actions;
export default authSlice.reducer;
