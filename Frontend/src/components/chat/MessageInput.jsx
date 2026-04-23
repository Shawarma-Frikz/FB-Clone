function MessageInput({ composer, onTextChange, onAttachmentChange, onSubmit }) {
  return (
    <form className="border-t border-[#dce1e8] bg-white p-4 sm:p-5" onSubmit={onSubmit}>
      {composer.preview ? (
        <div className="mb-3 rounded-2xl border border-[#dce1e8] bg-[#f5f6f7] p-3 text-sm text-[#3a3b3c]">
          Attachment ready: {composer.attachment?.name}
          {composer.attachment?.type?.startsWith("image/") ? (
            <img className="mt-2 max-h-40 rounded-xl object-cover" src={composer.preview} alt={composer.attachment?.name} />
          ) : null}
          {composer.attachment?.type?.startsWith("video/") ? (
            <video className="mt-2 max-h-40 rounded-xl object-cover" src={composer.preview} muted playsInline controls />
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2 sm:gap-3">
        <label
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[#dce1e8] bg-[#f2f3f5] text-lg text-[#3a3b3c] transition hover:bg-[#e8eaee]"
          title="Attach"
        >
          +
          <input className="hidden" type="file" onChange={onAttachmentChange} />
        </label>

        <input
          className="ds-input min-w-0 flex-1 rounded-full"
          placeholder="Aa"
          value={composer.text}
          onChange={(event) => onTextChange(event.target.value)}
        />

        <button
          className="grid h-11 min-w-11 place-items-center rounded-full bg-[#1877f2] px-4 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
          type="submit"
        >
          ➤
        </button>
      </div>
    </form>
  );
}

export default MessageInput;
