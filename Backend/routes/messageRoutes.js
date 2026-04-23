const express = require("express");
const {
	getMessages,
	sendMessage,
	markSeen,
	getUnreadMessagesCount
} = require("../controllers/messageController");
const { uploadChatAttachment } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/unread/count", getUnreadMessagesCount);
router.get("/:userId", getMessages);
router.post("/:userId", uploadChatAttachment, sendMessage);
router.patch("/:messageId/seen", markSeen);

module.exports = router;
