import api from "./api";

export const fetchFriendStories = () => api.get("/stories/friends");

export const createStory = (formData) => api.post("/stories", formData);