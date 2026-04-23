import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  acceptFriendRequestThunk,
  fetchFriendsData,
  rejectFriendRequestThunk,
  removeFriendThunk,
  sendFriendRequestThunk
} from "../features/friends/friendsSlice";

function FriendsPage() {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const { friends, users, loading, actionLoading, error } = useSelector((state) => state.friends);

  useEffect(() => {
    dispatch(fetchFriendsData());
  }, [dispatch]);

  const lookupUser = (userId) => users.find((candidate) => candidate._id === userId);

  const sentRequestIds = authUser?.friendRequests?.sent || [];
  const receivedRequestIds = authUser?.friendRequests?.received || [];
  const friendIds = useMemo(() => new Set(friends.map((friend) => friend._id)), [friends]);

  const pendingSuggestions = users.filter(
    (candidate) => candidate._id !== authUser?._id && !friendIds.has(candidate._id)
  );

  const handleAction = async (action, userId) => {
    await dispatch(action(userId));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <section className="space-y-4">
        {error ? (
          <div className="ds-card rounded-2xl px-4 py-3 text-sm text-rose-500">{error}</div>
        ) : null}

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Friends</p>
          <h2 className="text-2xl font-bold text-[#1c1e21]">Your social graph</h2>
        </div>

        <div className="ds-card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-[#1c1e21]">Friend requests received</h3>
          <div className="mt-4 grid gap-3">
            {receivedRequestIds.length ? (
              receivedRequestIds.map((userId) => {
                const person = lookupUser(userId);

                return (
                  <div key={userId} className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce1e8] bg-[#f9fafb] p-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-12 w-12 rounded-2xl object-cover"
                        src={person?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.name || "U")}`}
                        alt={person?.name}
                      />
                      <div>
                        <p className="font-semibold text-[#1c1e21]">{person?.name || "Unknown user"}</p>
                        <p className="text-sm text-[#65676b]">{person?.bio || "Wants to connect"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-2xl bg-[#1877f2] px-3 py-2 text-sm font-semibold text-white" onClick={() => handleAction(acceptFriendRequestThunk, userId)} type="button" disabled={actionLoading}>Accept</button>
                      <button className="rounded-2xl border border-[#dce1e8] bg-white px-3 py-2 text-sm font-semibold text-[#3a3b3c]" onClick={() => handleAction(rejectFriendRequestThunk, userId)} type="button" disabled={actionLoading}>Reject</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce1e8] px-4 py-6 text-sm text-[#65676b]">No incoming requests.</p>
            )}
          </div>
        </div>

        <div className="ds-card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-[#1c1e21]">Friends</h3>
          <div className="mt-4 grid gap-3">
            {loading ? (
              <p className="text-sm text-[#65676b]">Loading friends...</p>
            ) : friends.length ? (
              friends.map((friend) => (
                <div key={friend._id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce1e8] bg-[#f9fafb] p-4">
                  <div className="flex items-center gap-3">
                    <img className="h-12 w-12 rounded-2xl object-cover" src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || "U")}`} alt={friend.name} />
                    <div>
                      <p className="font-semibold text-[#1c1e21]">{friend.name}</p>
                      <p className="text-sm text-[#65676b]">{friend.bio || "Friend"}</p>
                    </div>
                  </div>
                  <button className="rounded-2xl border border-[#dce1e8] bg-white px-3 py-2 text-sm font-semibold text-[#3a3b3c]" onClick={() => handleAction(removeFriendThunk, friend._id)} type="button" disabled={actionLoading}>
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce1e8] px-4 py-6 text-sm text-[#65676b]">No friends yet.</p>
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="ds-card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-[#1c1e21]">Sent requests</h3>
          <div className="mt-4 grid gap-3">
            {sentRequestIds.length ? (
              sentRequestIds.map((userId) => {
                const person = lookupUser(userId);
                return (
                  <div key={userId} className="rounded-2xl border border-[#dce1e8] bg-[#f9fafb] p-4">
                    <p className="font-semibold text-[#1c1e21]">{person?.name || "Unknown user"}</p>
                    <p className="text-sm text-[#65676b]">Pending request</p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[#65676b]">No pending outgoing requests.</p>
            )}
          </div>
        </div>

        <div className="ds-card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-[#1c1e21]">People you may know</h3>
          <div className="mt-4 grid gap-3">
            {pendingSuggestions.slice(0, 6).map((candidate) => (
              <div key={candidate._id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce1e8] bg-[#f9fafb] p-4">
                <div className="flex items-center gap-3">
                  <img className="h-10 w-10 rounded-2xl object-cover" src={candidate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name || "U")}`} alt={candidate.name} />
                  <div>
                    <p className="font-semibold text-[#1c1e21]">{candidate.name}</p>
                    <p className="text-xs text-[#65676b]">{candidate.bio || "Suggested connection"}</p>
                  </div>
                </div>
                <button className="rounded-2xl bg-[#1877f2] px-3 py-2 text-sm font-semibold text-white" onClick={() => handleAction(sendFriendRequestThunk, candidate._id)} type="button" disabled={actionLoading}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default FriendsPage;