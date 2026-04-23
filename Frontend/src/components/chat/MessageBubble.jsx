function MessageBubble({ message, isMine, formatTime, renderAttachment }) {
  return (
    <div className={["flex", isMine ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[82%] px-4 py-2.5 shadow-lg shadow-black/10",
          isMine
            ? "rounded-3xl rounded-br-lg bg-[#1877f2] text-white"
            : "rounded-3xl rounded-bl-lg border border-[#dce1e8] bg-white text-[#1c1e21]"
        ].join(" ")}
      >
        {message.text ? <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p> : null}
        {renderAttachment(message)}
        <div className={["mt-1.5 text-[11px]", isMine ? "text-blue-100" : "text-[#65676b]"].join(" ")}>
          {formatTime(message.createdAt)} {message.seen ? "· Seen" : ""}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
