import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Post from "../components/Post";
import {
  addCommentThunk,
  createPostThunk,
  deletePostThunk,
  fetchFeedData,
  toggleLikePostThunk,
  uploadStoryThunk
} from "../features/posts/postsSlice";
import { formatRelativeTime } from "../utils/media";

const initialComposer = { content: "", media: [] };

function HomeFeedPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    stories,
    posts,
    loadingFeed,
    creatingPost,
    uploadingStory
  } = useSelector((state) => state.posts);
  const storyInputRef = useRef(null);
  const [storyError, setStoryError] = useState("");
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [composer, setComposer] = useState(initialComposer);
  const [composerPreviews, setComposerPreviews] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});

  const postSkeletons = ["sk-1", "sk-2", "sk-3"];

  useEffect(() => {
    dispatch(fetchFeedData());
  }, [dispatch]);

  const handleMediaChange = (event) => {
    const files = Array.from(event.target.files || []);

    setComposer((current) => ({ ...current, media: files }));
    setComposerPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));

      return files.map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      }));
    });
  };

  useEffect(() => {
    return () => {
      composerPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [composerPreviews]);

  const handleCreatePost = async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData();
      formData.append("content", composer.content);
      composer.media.forEach((file) => formData.append("media", file));

      await dispatch(createPostThunk(formData)).unwrap();
      setComposer(initialComposer);
      setComposerPreviews((current) => {
        current.forEach((preview) => URL.revokeObjectURL(preview.url));
        return [];
      });
    } catch (error) {
      setStoryError(error || "Unable to create post right now.");
    }
  };

  const toggleLike = async (postId) => {
    await dispatch(toggleLikePostThunk({ postId, userId: user?._id }));
  };

  const submitComment = async (postId) => {
    const text = (commentDrafts[postId] || "").trim();

    if (!text) {
      return;
    }

    await dispatch(addCommentThunk({ postId, text }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  const removePost = async (postId) => {
    await dispatch(deletePostThunk(postId));
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedStory(null);
        setSelectedPost(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const isVideoStory = (mediaUrl = "") =>
    mediaUrl.includes("/video/upload/") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl);

  const handleStoryUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setStoryError("");

    try {
      const payload = new FormData();
      payload.append("media", file);

      await dispatch(uploadStoryThunk(payload)).unwrap();
    } catch (error) {
      setStoryError(error || "Unable to upload story right now.");
    } finally {
      if (storyInputRef.current) {
        storyInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="ds-card rounded-3xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Stories</p>
              <h2 className="text-xl font-bold text-[#1c1e21]">Latest friend stories</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-full bg-[#1877f2] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#166fe5]">
                {uploadingStory ? "Uploading..." : "Add story"}
                <input
                  ref={storyInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleStoryUpload}
                  disabled={uploadingStory}
                />
              </label>
            </div>
          </div>

          {storyError ? (
            <div className="mt-3 rounded-2xl border border-[#f5c2c7] bg-[#fdecef] px-4 py-2 text-xs text-[#b3261e]">
              {storyError}
            </div>
          ) : null}

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {stories.length ? (
              stories.map((story) => (
                <button
                  key={story._id}
                  className="min-w-[160px] rounded-3xl border border-[#dce1e8] bg-white p-3 text-left transition hover:border-[#b8d5ff]"
                  onClick={() => setSelectedStory(story)}
                  type="button"
                >
                  {isVideoStory(story.media) ? (
                    <video className="h-40 w-full rounded-2xl object-cover" src={story.media} muted playsInline controls />
                  ) : (
                    <div
                      className="h-40 rounded-2xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${story.media})` }}
                    />
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      className="h-10 w-10 rounded-2xl object-cover"
                      src={story.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.user?.name || "U")}`}
                      alt={story.user?.name}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#1c1e21]">{story.user?.name}</p>
                      <p className="text-xs text-[#65676b]">{formatRelativeTime(story.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#dce1e8] px-4 py-10 text-sm text-[#65676b]">
                No active stories from friends yet.
              </div>
            )}
          </div>
        </article>

        <aside className="ds-card rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Composer</p>
          <h2 className="mt-1 text-xl font-bold text-[#1c1e21]">Create a post</h2>

          <form className="mt-4 space-y-4" onSubmit={handleCreatePost}>
            <textarea
              className="ds-input min-h-32 w-full rounded-3xl"
              placeholder="What's happening?"
              value={composer.content}
              onChange={(event) => setComposer((current) => ({ ...current, content: event.target.value }))}
            />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-[#dce1e8] bg-[#f5f6f7] px-4 py-3 text-sm text-[#3a3b3c] transition hover:border-[#b8d5ff]">
              Attach images
              <input className="hidden" type="file" accept="image/*" multiple onChange={handleMediaChange} />
            </label>
            {composer.media.length ? (
              <div className="space-y-2">
                <div className="text-xs text-[#65676b]">{composer.media.length} file(s) selected</div>
                <div className="grid grid-cols-2 gap-2">
                  {composerPreviews.map((preview) =>
                    preview.type.startsWith("image/") ? (
                      <img key={preview.url} className="h-24 w-full rounded-xl object-cover" src={preview.url} alt={preview.name} />
                    ) : (
                      <video key={preview.url} className="h-24 w-full rounded-xl object-cover" src={preview.url} muted playsInline />
                    )
                  )}
                </div>
              </div>
            ) : null}
            <button className="w-full rounded-2xl bg-[#1877f2] px-4 py-3 font-semibold text-white transition hover:bg-[#166fe5]" type="submit" disabled={creatingPost}>
              {creatingPost ? "Publishing..." : "Publish post"}
            </button>
          </form>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65676b]">Feed</p>
            <h2 className="text-xl font-bold text-[#1c1e21]">Latest posts</h2>
          </div>
          <span className="text-sm text-[#65676b]">{loadingFeed ? "Loading..." : `${posts.length} posts`}</span>
        </div>

        <div className="space-y-4">
          {loadingFeed
            ? postSkeletons.map((id) => (
                <article key={id} className="ds-card rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="ds-skeleton h-12 w-12 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="ds-skeleton h-3 w-32 rounded" />
                      <div className="ds-skeleton h-3 w-20 rounded" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="ds-skeleton h-3 w-full rounded" />
                    <div className="ds-skeleton h-3 w-4/5 rounded" />
                  </div>
                  <div className="ds-skeleton mt-4 h-52 w-full rounded-2xl" />
                  <div className="mt-4 flex gap-2">
                    <div className="ds-skeleton h-9 w-20 rounded-full" />
                    <div className="ds-skeleton h-9 w-24 rounded-full" />
                  </div>
                </article>
              ))
            : posts.map((post) => {
            const canDelete = post.user?._id === user?._id;

            return (
              <Post
                key={post._id}
                post={post}
                canDelete={canDelete}
                onOpen={() => setSelectedPost(post)}
                onDelete={removePost}
                onLike={toggleLike}
                onComment={submitComment}
                commentValue={commentDrafts[post._id] || ""}
                onCommentChange={(postId, value) =>
                  setCommentDrafts((current) => ({ ...current, [postId]: value }))
                }
                formatTime={formatRelativeTime}
              />
            );
          })}

          {!posts.length && !loadingFeed ? (
            <div className="ds-card rounded-3xl px-6 py-12 text-center text-sm text-[#65676b]">
              The feed is empty. Create a post to get started.
            </div>
          ) : null}
        </div>
      </section>
      </div>

      {selectedStory ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="ds-card w-full max-w-4xl overflow-hidden rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#dce1e8] p-4">
              <div className="flex items-center gap-3">
                <img
                  className="h-10 w-10 rounded-2xl object-cover"
                  src={selectedStory.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStory.user?.name || "U")}`}
                  alt={selectedStory.user?.name}
                />
                <div>
                  <p className="font-semibold text-[#1c1e21]">{selectedStory.user?.name || "User"}</p>
                  <p className="text-xs text-[#65676b]">{formatRelativeTime(selectedStory.createdAt)}</p>
                </div>
              </div>
              <button
                className="rounded-full border border-[#dce1e8] bg-[#f2f3f5] px-3 py-1 text-sm font-semibold text-[#3a3b3c]"
                onClick={() => setSelectedStory(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="bg-[#f7f8fa]">
              {isVideoStory(selectedStory.media) ? (
                <video className="max-h-[80vh] w-full object-contain" src={selectedStory.media} controls autoPlay playsInline />
              ) : (
                <img className="max-h-[80vh] w-full object-contain" src={selectedStory.media} alt="Story" />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedPost ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="ds-card grid h-[88vh] w-full max-w-6xl overflow-hidden rounded-3xl lg:grid-cols-[1.1fr_0.9fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid place-items-center bg-[#f7f8fa] p-2">
              {selectedPost.media?.[0] ? (
                <img className="max-h-[82vh] w-full rounded-2xl object-contain" src={selectedPost.media[0]} alt="Post media" />
              ) : (
                <div className="rounded-2xl border border-dashed border-[#dce1e8] px-6 py-10 text-center text-sm text-[#65676b]">
                  This post has no media.
                </div>
              )}
            </div>

            <aside className="flex min-h-0 flex-col border-t border-[#dce1e8] bg-white lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between border-b border-[#dce1e8] p-4">
                <div className="flex items-center gap-3">
                  <img
                    className="h-11 w-11 rounded-2xl object-cover"
                    src={selectedPost.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPost.user?.name || "U")}`}
                    alt={selectedPost.user?.name}
                  />
                  <div>
                    <p className="font-semibold text-[#1c1e21]">{selectedPost.user?.name || "User"}</p>
                    <p className="text-xs text-[#65676b]">{formatRelativeTime(selectedPost.createdAt)}</p>
                  </div>
                </div>
                <button
                  className="rounded-full border border-[#dce1e8] bg-[#f2f3f5] px-3 py-1 text-sm font-semibold text-[#3a3b3c]"
                  onClick={() => setSelectedPost(null)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="rounded-2xl border border-[#dce1e8] bg-[#f7f8fa] p-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#65676b]">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#3a3b3c]">
                    {selectedPost.content || "No message attached to this post."}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#dce1e8] bg-[#f7f8fa] p-4 text-center">
                    <p className="text-2xl font-black text-[#1c1e21]">{selectedPost.likes?.length || 0}</p>
                    <p className="text-xs uppercase tracking-[0.15em] text-[#65676b]">Likes</p>
                  </div>
                  <div className="rounded-2xl border border-[#dce1e8] bg-[#f7f8fa] p-4 text-center">
                    <p className="text-2xl font-black text-[#1c1e21]">{selectedPost.comments?.length || 0}</p>
                    <p className="text-xs uppercase tracking-[0.15em] text-[#65676b]">Comments</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.15em] text-[#65676b]">Comments</p>
                  {(selectedPost.comments || []).length ? (
                    (selectedPost.comments || []).map((comment) => (
                      <div key={comment._id} className="rounded-2xl border border-[#dce1e8] bg-[#f7f8fa] px-4 py-3">
                        <p className="text-sm font-semibold text-[#1c1e21]">{comment.user?.name || "User"}</p>
                        <p className="text-sm text-[#3a3b3c]">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#dce1e8] px-4 py-8 text-sm text-[#65676b]">
                      No comments yet.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default HomeFeedPage;