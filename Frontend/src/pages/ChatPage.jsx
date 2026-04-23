import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatWindow from "../components/chat/ChatWindow";
import ConversationsList from "../components/chat/ConversationsList";
import {
  clearTypingUser,
  fetchChatFriends,
  fetchConversationThunk,
  markSeenInConversation,
  receiveSocketMessage,
  setOnlineUsers,
  setSelectedFriendId,
  setTypingUserId
} from "../features/chat/chatSlice";
import { getSocket } from "../services/socket";
import { formatRelativeTime, readFileAsDataUrl } from "../utils/media";

function ChatPage() {
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state) => state.auth);
  const {
    friends,
    selectedFriendId,
    messages,
    onlineUsers,
    typingUserId,
    loadingFriends,
    loadingMessages
  } = useSelector((state) => state.chat);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const [composer, setComposer] = useState({ text: "", attachment: null, preview: "" });

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend._id === selectedFriendId) || null,
    [friends, selectedFriendId]
  );

  useEffect(() => {
    dispatch(fetchChatFriends());
  }, [dispatch]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const socket = getSocket(accessToken);
    socketRef.current = socket;
    socket.connect();

    socket.on("users:online", (usersOnline) => dispatch(setOnlineUsers(usersOnline)));
    socket.on("message:new", ({ message }) => {
      dispatch(receiveSocketMessage({ message, currentUserId: user?._id }));
    });
    socket.on("message:seen", ({ messageId, by }) => {
      if (by === selectedFriendId) {
        dispatch(markSeenInConversation({ messageId }));
      }
    });
    socket.on("typing", ({ userId: otherUserId }) => dispatch(setTypingUserId(otherUserId)));
    socket.on("stop-typing", () => dispatch(clearTypingUser()));

    return () => {
      socket.off("users:online");
      socket.off("message:new");
      socket.off("message:seen");
      socket.off("typing");
      socket.off("stop-typing");
    };
  }, [accessToken, dispatch, selectedFriendId, user?._id]);

  useEffect(() => {
    if (!selectedFriendId) {
      return;
    }

    dispatch(fetchConversationThunk(selectedFriendId));
    socketRef.current?.emit("conversation:join", { userId: selectedFriendId });
  }, [dispatch, selectedFriendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedFriendId) {
      return undefined;
    }

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    if (composer.text.trim()) {
      socketRef.current?.emit("typing", { receiverId: selectedFriendId });
      typingTimer.current = setTimeout(() => {
        socketRef.current?.emit("stop-typing", { receiverId: selectedFriendId });
      }, 650);
    } else {
      socketRef.current?.emit("stop-typing", { receiverId: selectedFriendId });
    }

    return () => clearTimeout(typingTimer.current);
  }, [composer.text, selectedFriendId]);

  useEffect(() => {
    const unread = messages.filter((message) => message.sender?._id === selectedFriendId && !message.seen);

    unread.forEach((message) => {
      socketRef.current?.emit("message:seen", { messageId: message._id });
    });
  }, [messages, selectedFriendId]);

  const selectedFriendOnline = useMemo(
    () => onlineUsers.some((candidate) => candidate._id === selectedFriendId),
    [onlineUsers, selectedFriendId]
  );

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setComposer((current) => ({ ...current, attachment: null, preview: "" }));
      return;
    }

    const preview = await readFileAsDataUrl(file);
    setComposer((current) => ({ ...current, attachment: file, preview }));
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!selectedFriendId) {
      return;
    }

    const payload = { receiverId: selectedFriendId, text: composer.text };

    if (composer.attachment) {
      payload.attachment = {
        base64: composer.preview.split(",")[1],
        mimetype: composer.attachment.type,
        originalname: composer.attachment.name,
        size: composer.attachment.size
      };
    }

    socketRef.current?.emit("message:send", payload, (response) => {
      if (response?.success) {
        setComposer({ text: "", attachment: null, preview: "" });
        event.target.reset();
      }
    });
  };

  const renderAttachment = (message) => {
    if (!message.media) {
      return null;
    }

    if (message.messageType === "image") {
      return <img className="mt-3 max-h-72 rounded-2xl object-cover" src={message.media} alt={message.attachmentName || "Attachment"} />;
    }

    return (
      <a className="mt-3 inline-flex rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cyan-200" href={message.media} target="_blank" rel="noreferrer">
        Download {message.attachmentName || "file"}
      </a>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <ConversationsList
        friends={friends}
        loading={loadingFriends}
        selectedFriendId={selectedFriendId}
        onlineUsers={onlineUsers}
        onSelect={(friend) => dispatch(setSelectedFriendId(friend._id))}
      />

      <ChatWindow
        selectedFriend={selectedFriend}
        selectedFriendOnline={selectedFriendOnline}
        typingUserId={typingUserId}
        messages={messages}
        loadingMessages={loadingMessages}
        currentUserId={user?._id}
        formatTime={formatRelativeTime}
        renderAttachment={renderAttachment}
        bottomRef={bottomRef}
        composer={composer}
        onTextChange={(value) => setComposer((current) => ({ ...current, text: value }))}
        onAttachmentChange={handleAttachmentChange}
        onSubmit={handleSendMessage}
      />
    </div>
  );
}

export default ChatPage;