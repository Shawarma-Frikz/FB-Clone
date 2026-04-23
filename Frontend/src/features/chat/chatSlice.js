import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchConversation } from "../../services/messageService";
import { fetchFriends } from "../../services/userService";

export const fetchChatFriends = createAsyncThunk("chat/fetchFriends", async (_, thunkAPI) => {
  try {
    const response = await fetchFriends();
    return response.data?.data?.friends || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to load chat friends");
  }
});

export const fetchConversationThunk = createAsyncThunk("chat/fetchConversation", async (userId, thunkAPI) => {
  try {
    const response = await fetchConversation(userId);
    return {
      userId,
      messages: response.data?.data?.messages || []
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to load conversation");
  }
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    friends: [],
    selectedFriendId: null,
    messages: [],
    onlineUsers: [],
    typingUserId: null,
    loadingFriends: false,
    loadingMessages: false,
    error: null
  },
  reducers: {
    setSelectedFriendId(state, action) {
      state.selectedFriendId = action.payload;
    },
    setOnlineUsers(state, action) {
      state.onlineUsers = action.payload || [];
    },
    setTypingUserId(state, action) {
      state.typingUserId = action.payload || null;
    },
    clearTypingUser(state) {
      state.typingUserId = null;
    },
    receiveSocketMessage(state, action) {
      const { message, currentUserId } = action.payload;

      const relevantUserId = state.selectedFriendId;
      const partnerId = message.sender?._id === currentUserId ? message.receiver?._id : message.sender?._id;

      if (!relevantUserId || partnerId !== relevantUserId) {
        return;
      }

      if (state.messages.some((existing) => existing._id === message._id)) {
        return;
      }

      state.messages.push(message);
    },
    markSeenInConversation(state, action) {
      const { messageId } = action.payload;
      state.messages = state.messages.map((message) =>
        message._id === messageId ? { ...message, seen: true } : message
      );
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatFriends.pending, (state) => {
        state.loadingFriends = true;
        state.error = null;
      })
      .addCase(fetchChatFriends.fulfilled, (state, action) => {
        state.loadingFriends = false;
        state.friends = action.payload;

        if (!state.selectedFriendId && action.payload.length) {
          state.selectedFriendId = action.payload[0]._id;
        }

        if (state.selectedFriendId) {
          const stillExists = action.payload.some((friend) => friend._id === state.selectedFriendId);
          if (!stillExists) {
            state.selectedFriendId = action.payload[0]?._id || null;
          }
        }
      })
      .addCase(fetchChatFriends.rejected, (state, action) => {
        state.loadingFriends = false;
        state.error = action.payload || "Unable to load chat friends";
      })
      .addCase(fetchConversationThunk.pending, (state) => {
        state.loadingMessages = true;
        state.error = null;
      })
      .addCase(fetchConversationThunk.fulfilled, (state, action) => {
        state.loadingMessages = false;

        if (state.selectedFriendId === action.payload.userId) {
          state.messages = action.payload.messages;
        }
      })
      .addCase(fetchConversationThunk.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload || "Unable to load conversation";
      });
  }
});

export const {
  setSelectedFriendId,
  setOnlineUsers,
  setTypingUserId,
  clearTypingUser,
  receiveSocketMessage,
  markSeenInConversation
} = chatSlice.actions;

export default chatSlice.reducer;
