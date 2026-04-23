const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const { uploadMediaFromBuffer } = require("./cloudinary");
const { emitNotificationToUser } = require("../sockets/realtime");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildPairQuery = (firstUserId, secondUserId) => ({
  members: { $all: [firstUserId, secondUserId], $size: 2 }
});

const getOrCreateConversation = async (firstUserId, secondUserId) => {
  let conversation = await Conversation.findOne(buildPairQuery(firstUserId, secondUserId));

  if (!conversation) {
    conversation = await Conversation.create({
      members: [firstUserId, secondUserId]
    });
  }

  return conversation;
};

const resolveMessageType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType) {
    return "file";
  }

  return "text";
};

const buildAttachmentFile = (attachment) => {
  if (!attachment) {
    return null;
  }

  if (attachment.buffer && attachment.mimetype) {
    return attachment;
  }

  if (attachment.base64 && attachment.mimetype) {
    return {
      buffer: Buffer.from(attachment.base64, "base64"),
      mimetype: attachment.mimetype,
      originalname: attachment.originalname || attachment.name || "attachment"
    };
  }

  return null;
};

const createAndStoreMessage = async ({ senderId, receiverId, text = "", attachment = null }) => {
  if (!isValidObjectId(senderId) || !isValidObjectId(receiverId)) {
    throw new Error("Invalid user id");
  }

  const cleanedText = typeof text === "string" ? text.trim() : "";
  const uploadFile = buildAttachmentFile(attachment);

  if (!cleanedText && !uploadFile) {
    throw new Error("Message text or attachment is required");
  }

  const conversation = await getOrCreateConversation(senderId, receiverId);

  let media = "";
  let attachmentName = "";
  let attachmentMimeType = "";
  let attachmentSize = 0;
  let messageType = "text";

  if (uploadFile) {
    messageType = resolveMessageType(uploadFile.mimetype);
    media = await uploadMediaFromBuffer(uploadFile, "fb-social/messages", messageType === "file" ? "raw" : messageType);
    attachmentName = uploadFile.originalname || "attachment";
    attachmentMimeType = uploadFile.mimetype;
    attachmentSize = uploadFile.size || uploadFile.buffer?.length || 0;
  }

  if (messageType === "text" && !cleanedText) {
    throw new Error("Message text is required");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    receiver: receiverId,
    text: cleanedText,
    media,
    messageType,
    attachmentName,
    attachmentMimeType,
    attachmentSize
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  const notification = await Notification.create({
    recipient: receiverId,
    sender: senderId,
    type: "new_message"
  });
  const populatedNotification = await Notification.findById(notification._id).populate("sender", "name avatar");
  emitNotificationToUser(receiverId, populatedNotification);

  return Message.findById(message._id)
    .populate("sender", "name avatar")
    .populate("receiver", "name avatar")
    .populate("conversation");
};

const getConversationMessages = async (firstUserId, secondUserId) => {
  if (!isValidObjectId(firstUserId) || !isValidObjectId(secondUserId)) {
    throw new Error("Invalid user id");
  }

  const conversation = await Conversation.findOne(buildPairQuery(firstUserId, secondUserId));

  if (!conversation) {
    return {
      conversation: null,
      messages: []
    };
  }

  const messages = await Message.find({ conversation: conversation._id })
    .populate("sender", "name avatar")
    .populate("receiver", "name avatar")
    .sort({ createdAt: 1 });

  return { conversation, messages };
};

const markMessageSeen = async ({ messageId, userId }) => {
  if (!isValidObjectId(messageId) || !isValidObjectId(userId)) {
    throw new Error("Invalid identifier");
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return null;
  }

  if (message.receiver.toString() !== userId.toString()) {
    return null;
  }

  message.seen = true;
  message.seenAt = new Date();
  await message.save();

  return Message.findById(messageId)
    .populate("sender", "name avatar")
    .populate("receiver", "name avatar")
    .populate("conversation");
};

module.exports = {
  createAndStoreMessage,
  getConversationMessages,
  markMessageSeen
};