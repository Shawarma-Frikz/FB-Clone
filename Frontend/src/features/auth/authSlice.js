import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchMeRequest, loginRequest, registerRequest } from "../../services/authService";
import { clearAuthStorage, readAuthStorage, writeAuthStorage } from "../../services/authStorage";

const storedAuth = readAuthStorage();

const persistAuth = (state) => {
  if (state.user && state.accessToken && state.refreshToken) {
    writeAuthStorage({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken
    });
    return;
  }

  clearAuthStorage();
};

export const loginUser = createAsyncThunk("auth/loginUser", async (credentials, thunkAPI) => {
  try {
    const { data } = await loginRequest(credentials);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

export const registerUser = createAsyncThunk("auth/registerUser", async (payload, thunkAPI) => {
  try {
    const { data } = await registerRequest(payload);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Registration failed");
  }
});

export const loadCurrentUser = createAsyncThunk("auth/loadCurrentUser", async (_, thunkAPI) => {
  try {
    const { data } = await fetchMeRequest();
    return data.data.user;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Session expired");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedAuth?.user || null,
    accessToken: storedAuth?.accessToken || null,
    refreshToken: storedAuth?.refreshToken || null,
    loading: false,
    error: null
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      persistAuth(state);
    }
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || "Something went wrong";
    };

    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persistAuth(state);
      })
      .addCase(loginUser.rejected, handleRejected)
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persistAuth(state);
      })
      .addCase(registerUser.rejected, handleRejected)
      .addCase(loadCurrentUser.pending, handlePending)
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        persistAuth(state);
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        persistAuth(state);
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;