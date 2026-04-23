import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import Card from "./ui/Card";

function Post({
  post,
  canDelete = false,
  onOpen,
  onDelete,
  onLike,
  onComment,
  commentValue = "",
  onCommentChange,
  formatTime
}) {
  const displayName = post.user?.name || "User";
  const avatar = post.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

  return (
    <Card className="cursor-pointer" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={avatar} name={displayName} size="md" className="h-12 w-12" />
          <div>
            <p className="ds-text-name">{displayName}</p>
            <p className="ds-text-meta">{formatTime(post.createdAt)}</p>
          </div>
        </div>

        {canDelete ? (
          <Button
            variant="secondary"
            className="rounded-full px-3 py-1 text-xs"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.(post._id);
            }}
            type="button"
          >
            Delete
          </Button>
        ) : null}
      </div>

      {post.content ? <p className="ds-text-content mt-4 whitespace-pre-wrap leading-7">{post.content}</p> : null}

      {post.media?.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {post.media.map((item) => (
            <img key={item} className="max-h-96 w-full rounded-3xl object-cover" src={item} alt="Post media" />
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <Button
          variant="secondary"
          className="rounded-full px-4 py-2 text-sm"
          onClick={(event) => {
            event.stopPropagation();
            onLike?.(post._id);
          }}
          type="button"
        >
          Like {post.likes?.length || 0}
        </Button>

        <Button
          variant="secondary"
          className="rounded-full px-4 py-2 text-sm"
          onClick={(event) => {
            event.stopPropagation();
            onComment?.(post._id);
          }}
          type="button"
        >
          Comment
        </Button>

        <span className="ds-text-meta">{post.comments?.length || 0} comments</span>
      </div>

      <div className="mt-4 space-y-3">
        {(post.comments || []).map((comment) => (
          <div key={comment._id} className="rounded-xl border border-[#dce1e8] bg-[#f7f8fa] px-4 py-3">
            <p className="text-sm font-semibold text-[#1c1e21]">{comment.user?.name || "User"}</p>
            <p className="text-sm text-[#3a3b3c]">{comment.text}</p>
          </div>
        ))}

        <div className="flex gap-3">
          <input
            className="ds-input min-w-0 flex-1 rounded-xl"
            placeholder="Write a comment..."
            value={commentValue}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onCommentChange?.(post._id, event.target.value)}
          />
          <Button
            className="rounded-xl px-4 py-3 text-sm"
            onClick={(event) => {
              event.stopPropagation();
              onComment?.(post._id);
            }}
            type="button"
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default Post;
