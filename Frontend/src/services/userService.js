import api from "./api";

export const fetchProfile = () => api.get("/users/profile");

export const updateProfile = (formData) => api.put("/users/profile", formData);

export const fetchFriends = () => api.get("/users/friends");
export const fetchAllUsers = () => api.get("/users");

export const sendFriendRequest = (userId) => api.post(`/users/friends/request/${userId}`);
export const acceptFriendRequest = (userId) => api.post(`/users/friends/request/${userId}/accept`);
export const rejectFriendRequest = (userId) => api.post(`/users/friends/request/${userId}/reject`);
export const removeFriend = (userId) => api.delete(`/users/friends/${userId}`);