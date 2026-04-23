const mongoose = require("mongoose");
const Message = require("../models/Message");
const {
  createAndStoreMessage,
  getConversationMessages,
  markMessageSeen
} = require("../utils/chatService");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    const thread = await getConversationMessages(req.user._id, userId);

    res.status(200).json({
      success: true,
      message: "Conversation messages fetched successfully",
      data: thread
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    const message = await createAndStoreMessage({
      senderId: req.user._id,
      receiverId: userId,
      text: req.body.text,
      attachment: req.file || null
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

const markSeen = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message id"
      });
    }

    const message = await markMessageSeen({ messageId, userId: req.user._id });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Message marked as seen",
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadMessagesCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      seen: false
    });

    res.status(200).json({
      success: true,
      message: "Unread messages count fetched successfully",
      data: {
        count
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markSeen,
  getUnreadMessagesCount
};
