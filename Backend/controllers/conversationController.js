const Conversation = require("../models/Conversation");

const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find().populate("members lastMessage");
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations
};
