import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { logout } from "../features/auth/authSlice";
import { fetchUnreadMessagesCount } from "../services/messageService";
import { fetchUnreadNotificationsCount } from "../services/notificationService";
import { disconnectSocket, getSocket } from "../services/socket";
import { fetchAllUsers, fetchFriends } from "../services/userService";

const navItems = [
  { to: "/app/feed", label: "Home feed" },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/friends", label: "Friends" },
  { to: "/app/chat", label: "Chat" },
  { to: "/app/notifications", label: "Notifications" }
];

const formatNotificationMessage = (type) => {
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

function AppShell() {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [notificationToasts, setNotificationToasts] = useState([]);
  const socketRef = useRef(null);
  const toastTimeoutsRef = useRef(new Map());
  const initials = (user?.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navBadges = useMemo(
    () => ({
      "/app/chat": unreadMessagesCount,
      "/app/notifications": unreadNotificationsCount
    }),
    [unreadMessagesCount, unreadNotificationsCount]
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const refreshUnreadCounts = async () => {
      try {
        const [messagesResponse, notificationsResponse] = await Promise.all([
          fetchUnreadMessagesCount(),
          fetchUnreadNotificationsCount()
        ]);

        setUnreadMessagesCount(messagesResponse.data?.data?.count || 0);
        setUnreadNotificationsCount(notificationsResponse.data?.data?.count || 0);
      } catch {
        // Keep prior badge values on transient API errors.
      }
    };

    refreshUnreadCounts();
    const timer = window.setInterval(refreshUnreadCounts, 15000);

    return () => window.clearInterval(timer);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const socket = getSocket(accessToken);
    socketRef.current = socket;
    socket.connect();

    const handleNotification = (notification) => {
      setUnreadNotificationsCount((current) => current + 1);
      const toastId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const senderName = notification?.sender?.name || "Someone";

      setNotificationToasts((current) => [
        ...current.slice(-2),
        {
          id: toastId,
          senderName,
          senderAvatar: notification?.sender?.avatar || "",
          message: `${senderName} ${formatNotificationMessage(notification?.type)}`
        }
      ]);

      const timeoutId = window.setTimeout(() => {
        setNotificationToasts((current) => current.filter((toast) => toast.id !== toastId));
        toastTimeoutsRef.current.delete(toastId);
      }, 4500);

      toastTimeoutsRef.current.set(toastId, timeoutId);
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
      toastTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      toastTimeoutsRef.current.clear();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const loadSidebarData = async () => {
      try {
        const [friendsResponse, usersResponse] = await Promise.all([fetchFriends(), fetchAllUsers()]);
        const friendList = friendsResponse.data?.data?.friends || [];
        const users = usersResponse.data?.data?.users || [];
        const friendIds = new Set(friendList.map((friend) => friend._id));

        setFriends(friendList);
        setSuggestions(
          users.filter((candidate) => candidate._id !== user?._id && !friendIds.has(candidate._id)).slice(0, 6)
        );
      } catch {
        setFriends([]);
        setSuggestions([]);
      }
    };

    loadSidebarData();
  }, [accessToken, user?._id]);

  return (
    <div className="ds-page">
      <div className="pointer-events-none fixed right-4 top-20 z-50 grid max-w-sm gap-2">
        {notificationToasts.map((toast) => (
          <article
            key={toast.id}
            className="pointer-events-auto ds-card-soft ds-modal-enter flex items-start gap-3 rounded-2xl border border-[#dce1e8] bg-white p-3 shadow-lg"
          >
            <Avatar src={toast.senderAvatar} name={toast.senderName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1c1e21]">New notification</p>
              <p className="mt-0.5 text-sm text-[#3a3b3c]">{toast.message}</p>
            </div>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-xs font-semibold text-[#65676b] hover:bg-[#f2f3f5]"
              onClick={() => {
                const timeoutId = toastTimeoutsRef.current.get(toast.id);
                if (timeoutId) {
                  window.clearTimeout(timeoutId);
                  toastTimeoutsRef.current.delete(toast.id);
                }
                setNotificationToasts((current) => current.filter((candidate) => candidate.id !== toast.id));
              }}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </article>
        ))}
      </div>
      <header className="sticky top-0 z-30 border-b border-[#dce1e8] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="brand-mark inline-flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.25em] text-[#1877f2]" />
          <div className="hidden text-lg font-black text-[#1c1e21] md:block">fb social</div>

          <div className="min-w-0 flex-1">
            <input
              className="ds-input rounded-full"
              placeholder="Search"
              aria-label="Search"
            />
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isActive ? "bg-[#e7f3ff] text-[#1877f2]" : "text-[#65676b] hover:bg-[#f2f3f5]"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Avatar name={user?.name || "User"} src={user?.avatar} size="sm" />
            <span className="hidden pr-1 text-sm font-semibold text-[#1c1e21] sm:block">{user?.name || "User"}</span>
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={() => {
                disconnectSocket();
                dispatch(logout());
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <Card className="h-fit" padding="md">
          <div className="space-y-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Navigation</p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "ds-transition flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold",
                    isActive
                      ? "bg-[#e7f3ff] text-[#1877f2]"
                      : "text-[#3a3b3c] hover:bg-[#f2f3f5]"
                  ].join(" ")
                }
              >
                <span>{item.label}</span>
                {navBadges[item.to] ? (
                  <span className="ds-badge ds-badge-pulse">{navBadges[item.to]}</span>
                ) : null}
              </NavLink>
            ))}
          </div>
          </Card>
        </aside>

        <main className="min-w-0">
          <Card className="mb-6" padding="md">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={user?.name || "User"} src={user?.avatar} size="md" />
              <div className="flex-1 rounded-full border border-[#dce1e8] bg-[#f2f3f5] px-4 py-3 text-sm text-[#65676b]">
                What's on your mind, {user?.name?.split(" ")[0] || "there"}?
              </div>
            </div>
          </Card>

          <section className="space-y-4">
            <Outlet />
          </section>
        </main>

        <aside className="hidden xl:block xl:sticky xl:top-24">
          <Card className="h-fit" padding="md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Online friends</p>
            <div className="mt-3 space-y-2">
              {friends.length ? friends.slice(0, 7).map((friend) => (
                <div key={friend._id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#f5f6f7]">
                  <Avatar src={friend.avatar} name={friend.name} size="sm" />
                  <span className="text-sm font-medium text-[#1c1e21]">{friend.name}</span>
                </div>
              )) : <p className="text-sm text-[#65676b]">No friends online right now.</p>}
            </div>
          </div>

          <div className="mt-5 border-t border-[#dce1e8] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">People you may know</p>
            <div className="mt-3 space-y-2">
              {suggestions.length ? suggestions.map((candidate) => (
                <div key={candidate._id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#f5f6f7]">
                  <Avatar src={candidate.avatar} name={candidate.name} size="sm" />
                  <span className="text-sm font-medium text-[#1c1e21]">{candidate.name}</span>
                </div>
              )) : <p className="text-sm text-[#65676b]">No suggestions available.</p>}
            </div>
          </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default AppShell;