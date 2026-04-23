import api from "./api";

export const fetchPosts = () => api.get("/posts");

export const createPost = (formData) => api.post("/posts", formData);

export const likePost = (postId) => api.post(`/posts/${postId}/like`);
export const addComment = (postId, payload) => api.post(`/posts/${postId}/comments`, payload);
export const deletePost = (postId) => api.delete(`/posts/${postId}`);