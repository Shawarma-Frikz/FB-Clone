import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { addComment, createPost, deletePost, fetchPosts, likePost } from "../../services/postService";
import { createStory, fetchFriendStories } from "../../services/storyService";

const toggleLikeLocally = (post, userId) => {
  const alreadyLiked = (post.likes || []).some((likeUser) => likeUser?._id === userId || likeUser === userId);

  if (alreadyLiked) {
    return {
      ...post,
      likes: (post.likes || []).filter((likeUser) => (likeUser?._id || likeUser) !== userId)
    };
  }

  return {
    ...post,
    likes: [...(post.likes || []), { _id: userId }]
  };
};

export const fetchFeedData = createAsyncThunk("posts/fetchFeedData", async (_, thunkAPI) => {
  try {
    const [storiesResponse, postsResponse] = await Promise.all([fetchFriendStories(), fetchPosts()]);

    return {
      stories: storiesResponse.data?.data?.stories || [],
      posts: postsResponse.data?.data?.posts || []
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to load feed");
  }
});

export const createPostThunk = createAsyncThunk("posts/createPost", async (formData, thunkAPI) => {
  try {
    const response = await createPost(formData);
    return response.data?.data?.post;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to create post");
  }
});

export const toggleLikePostThunk = createAsyncThunk(
  "posts/toggleLikePost",
  async ({ postId }, thunkAPI) => {
    try {
      const response = await likePost(postId);
      return response.data?.data?.post;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to like post");
    }
  }
);

export const addCommentThunk = createAsyncThunk("posts/addComment", async ({ postId, text }, thunkAPI) => {
  try {
    const response = await addComment(postId, { text });
    return response.data?.data?.post;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to add comment");
  }
});

export const deletePostThunk = createAsyncThunk("posts/deletePost", async (postId, thunkAPI) => {
  try {
    await deletePost(postId);
    return postId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to delete post");
  }
});

export const uploadStoryThunk = createAsyncThunk("posts/uploadStory", async (formData, thunkAPI) => {
  try {
    const response = await createStory(formData);
    return response.data?.data?.story;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unable to upload story");
  }
});

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    posts: [],
    stories: [],
    loadingFeed: false,
    creatingPost: false,
    uploadingStory: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedData.pending, (state) => {
        state.loadingFeed = true;
        state.error = null;
      })
      .addCase(fetchFeedData.fulfilled, (state, action) => {
        state.loadingFeed = false;
        state.posts = action.payload.posts;
        state.stories = action.payload.stories;
      })
      .addCase(fetchFeedData.rejected, (state, action) => {
        state.loadingFeed = false;
        state.error = action.payload || "Unable to load feed";
      })
      .addCase(createPostThunk.pending, (state) => {
        state.creatingPost = true;
        state.error = null;
      })
      .addCase(createPostThunk.fulfilled, (state, action) => {
        state.creatingPost = false;
        if (action.payload) {
          state.posts = [action.payload, ...state.posts];
        }
      })
      .addCase(createPostThunk.rejected, (state, action) => {
        state.creatingPost = false;
        state.error = action.payload || "Unable to create post";
      })
      .addCase(toggleLikePostThunk.pending, (state, action) => {
        const { postId, userId } = action.meta.arg;

        if (!userId) {
          return;
        }

        state.posts = state.posts.map((post) =>
          post._id === postId ? toggleLikeLocally(post, userId) : post
        );
      })
      .addCase(toggleLikePostThunk.fulfilled, (state, action) => {
        if (!action.payload?._id) {
          return;
        }

        state.posts = state.posts.map((post) =>
          post._id === action.payload._id ? action.payload : post
        );
      })
      .addCase(toggleLikePostThunk.rejected, (state, action) => {
        const { postId, userId } = action.meta.arg;

        if (userId) {
          state.posts = state.posts.map((post) =>
            post._id === postId ? toggleLikeLocally(post, userId) : post
          );
        }

        state.error = action.payload || "Unable to like post";
      })
      .addCase(addCommentThunk.fulfilled, (state, action) => {
        if (!action.payload?._id) {
          return;
        }

        state.posts = state.posts.map((post) =>
          post._id === action.payload._id ? action.payload : post
        );
      })
      .addCase(addCommentThunk.rejected, (state, action) => {
        state.error = action.payload || "Unable to add comment";
      })
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.posts = state.posts.filter((post) => post._id !== action.payload);
      })
      .addCase(deletePostThunk.rejected, (state, action) => {
        state.error = action.payload || "Unable to delete post";
      })
      .addCase(uploadStoryThunk.pending, (state) => {
        state.uploadingStory = true;
        state.error = null;
      })
      .addCase(uploadStoryThunk.fulfilled, (state, action) => {
        state.uploadingStory = false;
        if (action.payload) {
          state.stories = [action.payload, ...state.stories];
        }
      })
      .addCase(uploadStoryThunk.rejected, (state, action) => {
        state.uploadingStory = false;
        state.error = action.payload || "Unable to upload story";
      });
  }
});

export default postsSlice.reducer;
