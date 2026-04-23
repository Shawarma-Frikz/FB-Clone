import api from "./api";

export const fetchConversation = (userId) => api.get(`/messages/${userId}`);
export const fetchUnreadMessagesCount = () => api.get("/messages/unread/count");

export const sendMessage = (userId, formData) => api.post(`/messages/${userId}`, formData);

export const markMessageSeen = (messageId) => api.patch(`/messages/${messageId}/seen`);