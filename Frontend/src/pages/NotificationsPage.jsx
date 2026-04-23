import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchNotifications, markAllNotificationsAsRead } from "../services/notificationService";
import { getSocket } from "../services/socket";
import { formatRelativeTime } from "../utils/media";

const formatNotificationType = (type) => {
  const typeMap = {
    friend_request: "sent you a friend request",
    friend_request_accepted: "accepted your friend request",
    new_message: "sent you a message",
    new_post: "shared a new post",
    post_like: "liked your post",
    post_comment: "commented on your post"
  };

  return typeMap[type] || "interacted with your account";
};

function NotificationsPage() {
  const { accessToken } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notificationsResponse = await fetchNotifications();
        setNotifications(notificationsResponse.data.data.notifications || []);
        setError("");
      } catch {
        setError("Unable to load notifications right now.");
      } finally {
        setLoading(false);
      }
    };

    const markReadSilently = async () => {
      try {
        await markAllNotificationsAsRead();
      } catch {
        // Keep the list visible even when mark-as-read fails.
      }
    };

    loadNotifications();
    markReadSilently();
    const timer = window.setInterval(loadNotifications, 15000);
    const socket = getSocket(accessToken);
    const handleIncomingNotification = () => {
      loadNotifications();
    };
    socket.on("notification:new", handleIncomingNotification);

    return () => {
      window.clearInterval(timer);
      socket.off("notification:new", handleIncomingNotification);
    };
  }, [accessToken]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Notifications</p>
        <h2 className="text-2xl font-bold text-[#1c1e21]">Recent activity</h2>
      </div>
      {error ? <div className="ds-card rounded-3xl p-4 text-sm text-[#d93025]">{error}</div> : null}

      <div className="space-y-3">
        {loading ? (
          <div className="ds-card rounded-3xl p-6 text-sm text-[#65676b]">Loading notifications...</div>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <article key={notification._id} className="ds-card flex items-center gap-4 rounded-3xl p-5">
              <img
                className="h-14 w-14 rounded-2xl object-cover"
                src={notification.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender?.name || "U")}`}
                alt={notification.sender?.name}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#1c1e21]">{notification.sender?.name || "Someone"}</p>
                <p className="text-sm text-[#65676b]">
                  {formatNotificationType(notification.type)}
                </p>
              </div>
              <span className="text-xs text-[#65676b]">{formatRelativeTime(notification.createdAt)}</span>
            </article>
          ))
        ) : (
          <div className="ds-card rounded-3xl p-6 text-sm text-[#65676b]">No notifications yet.</div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;