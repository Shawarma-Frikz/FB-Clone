const express = require("express");
const {
	getUsers,
	getUserProfile,
	updateUserProfile,
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	removeFriend,
	getFriendList
} = require("../controllers/userController");
const { uploadProfileImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getUsers);
router.get("/profile", getUserProfile);
router.put("/profile", uploadProfileImages, updateUserProfile);
router.get("/friends", getFriendList);
router.post("/friends/request/:userId", sendFriendRequest);
router.post("/friends/request/:userId/accept", acceptFriendRequest);
router.post("/friends/request/:userId/reject", rejectFriendRequest);
router.delete("/friends/:userId", removeFriend);

module.exports = router;
