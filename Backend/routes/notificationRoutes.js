const express = require("express");
const {
	getNotifications,
	getUnreadNotificationsCount,
	markAllNotificationsAsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getNotifications);
router.get("/unread/count", getUnreadNotificationsCount);
router.patch("/read-all", markAllNotificationsAsRead);

module.exports = router;
