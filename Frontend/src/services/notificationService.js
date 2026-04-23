import api from "./api";

export const fetchNotifications = () => api.get("/notifications");
export const fetchUnreadNotificationsCount = () => api.get("/notifications/unread/count");
export const markAllNotificationsAsRead = () => api.patch("/notifications/read-all");
