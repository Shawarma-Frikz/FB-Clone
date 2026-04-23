function ConversationsList({ friends, selectedFriendId, onlineUsers, onSelect, loading = false }) {
  return (
    <aside className="ds-card rounded-3xl p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Chat</p>
        <h2 className="text-2xl font-black text-[#1c1e21]">Conversations</h2>
      </div>

      <div className="mt-4 rounded-full border border-[#dce1e8] bg-[#f5f6f7] px-4 py-2.5 text-sm text-[#65676b]">
        Search conversations
      </div>

      <div className="mt-4 grid max-h-[68vh] gap-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#dce1e8] px-4 py-10 text-sm text-[#65676b]">
            Loading conversations...
          </div>
        ) : friends.length ? (
          friends.map((friend) => {
            const active = friend._id === selectedFriendId;
            const online = onlineUsers.some((candidate) => candidate._id === friend._id);

            return (
              <button
                key={friend._id}
                className={[
                  "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left ds-transition",
                  active
                    ? "border-[#b8d5ff] bg-[#e7f3ff]"
                    : "border-[#dce1e8] bg-white hover:bg-[#f5f6f7]"
                ].join(" ")}
                onClick={() => onSelect(friend)}
                type="button"
              >
                <div className="relative">
                  <img
                    className="h-12 w-12 rounded-2xl object-cover"
                    src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || "U")}`}
                    alt={friend.name}
                  />
                  <span
                    className={[
                      "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white",
                      online ? "bg-emerald-400" : "bg-slate-500"
                    ].join(" ")}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-[#1c1e21]">{friend.name}</p>
                    <span className="text-[11px] text-[#65676b]">{online ? "Online" : "Offline"}</span>
                  </div>
                  <p className="truncate text-xs text-[#65676b]">{friend.bio || "Tap to open chat"}</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#dce1e8] px-4 py-10 text-sm text-[#65676b]">
            Add friends first to start chatting.
          </div>
        )}
      </div>
    </aside>
  );
}

export default ConversationsList;
