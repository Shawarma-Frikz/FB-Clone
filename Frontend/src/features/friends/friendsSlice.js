import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadCurrentUser } from "../auth/authSlice";
import {
  acceptFriendRequest,
  fetchAllUsers,
  fetchFriends,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest
} from "../../services/userService";

export const fetchFriendsData = createAsyncThunk("friends/fetchFriendsData", async (_, thunkAPI) => {
  try {
    const [friendsResponse, usersResponse] = await Promise.all([fetchFriends(), fetchAllUsers()]);

    return {
      friends: friendsResponse.data?.data?.friends || [],
      users: usersResponse.data?.data?.users || []
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to load friends");
  }
});

const createFriendAction = (type, request) =>
  createAsyncThunk(type, async (userId, thunkAPI) => {
    try {
      await request(userId);
      await thunkAPI.dispatch(fetchFriendsData());
      await thunkAPI.dispatch(loadCurrentUser());
      return userId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Friend action failed");
    }
  });

export const sendFriendRequestThunk = createFriendAction("friends/sendRequest", sendFriendRequest);
export const acceptFriendRequestThunk = createFriendAction("friends/acceptRequest", acceptFriendRequest);
export const rejectFriendRequestThunk = createFriendAction("friends/rejectRequest", rejectFriendRequest);
export const removeFriendThunk = createFriendAction("friends/removeFriend", removeFriend);

const friendsSlice = createSlice({
  name: "friends",
  initialState: {
    friends: [],
    users: [],
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    const setActionLoadingPending = (state) => {
      state.actionLoading = true;
      state.error = null;
    };

    const setActionLoadingDone = (state) => {
      state.actionLoading = false;
    };

    const setActionLoadingError = (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || "Friend action failed";
    };

    builder
      .addCase(fetchFriendsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriendsData.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload.friends;
        state.users = action.payload.users;
      })
      .addCase(fetchFriendsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load friends";
      })
      .addCase(sendFriendRequestThunk.pending, setActionLoadingPending)
      .addCase(sendFriendRequestThunk.fulfilled, setActionLoadingDone)
      .addCase(sendFriendRequestThunk.rejected, setActionLoadingError)
      .addCase(acceptFriendRequestThunk.pending, setActionLoadingPending)
      .addCase(acceptFriendRequestThunk.fulfilled, setActionLoadingDone)
      .addCase(acceptFriendRequestThunk.rejected, setActionLoadingError)
      .addCase(rejectFriendRequestThunk.pending, setActionLoadingPending)
      .addCase(rejectFriendRequestThunk.fulfilled, setActionLoadingDone)
      .addCase(rejectFriendRequestThunk.rejected, setActionLoadingError)
      .addCase(removeFriendThunk.pending, setActionLoadingPending)
      .addCase(removeFriendThunk.fulfilled, setActionLoadingDone)
      .addCase(removeFriendThunk.rejected, setActionLoadingError);
  }
});

export default friendsSlice.reducer;
