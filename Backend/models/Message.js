const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  messageType: { type: String, enum: ["text", "image", "video", "file"], default: "text" },
  text: { type: String, default: "" },
  media: { type: String, default: "" },
  attachmentName: { type: String, default: "" },
  attachmentMimeType: { type: String, default: "" },
  attachmentSize: { type: Number, default: 0 },
  seen: { type: Boolean, default: false },
  seenAt: { type: Date, default: null }
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);