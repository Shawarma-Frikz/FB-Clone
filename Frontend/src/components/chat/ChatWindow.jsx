import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function ChatWindow({
  selectedFriend,
  selectedFriendOnline,
  typingUserId,
  messages,
  loadingMessages,
  currentUserId,
  formatTime,
  renderAttachment,
  bottomRef,
  composer,
  onTextChange,
  onAttachmentChange,
  onSubmit
}) {
  if (!selectedFriend) {
    return (
      <section className="ds-card grid min-h-[72vh] place-items-center rounded-3xl p-6 text-center">
        <div>
          <h3 className="text-2xl font-bold text-[#1c1e21]">No conversation selected</h3>
          <p className="mt-2 text-sm text-[#65676b]">
            Choose a person from the left to open your Messenger thread.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ds-card flex min-h-[72vh] flex-col overflow-hidden rounded-3xl">
      <header className="flex items-center justify-between gap-4 border-b border-[#dce1e8] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <img
            className="h-12 w-12 rounded-2xl object-cover"
            src={selectedFriend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFriend.name || "U")}`}
            alt={selectedFriend.name}
          />
          <div>
            <h3 className="text-lg font-bold text-[#1c1e21]">{selectedFriend.name}</h3>
            <p className="text-sm text-[#65676b]">{selectedFriendOnline ? "Active now" : "Offline"}</p>
          </div>
        </div>

        {typingUserId === selectedFriend._id ? (
          <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-xs font-semibold text-[#1877f2]">
            Typing...
          </span>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8fa] p-4 sm:p-5">
        {loadingMessages ? (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-[#dce1e8] px-6 py-20 text-center text-sm text-[#65676b]">
            Loading conversation...
          </div>
        ) : messages.length ? (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isMine={message.sender?._id === currentUserId}
              formatTime={formatTime}
              renderAttachment={renderAttachment}
            />
          ))
        ) : (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-[#dce1e8] px-6 py-20 text-center text-sm text-[#65676b]">
            Start your conversation with a quick message.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        composer={composer}
        onTextChange={onTextChange}
        onAttachmentChange={onAttachmentChange}
        onSubmit={onSubmit}
      />
    </section>
  );
}

export default ChatWindow;
