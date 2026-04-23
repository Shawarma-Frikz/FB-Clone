const express = require("express");
const { createStory, getStories, getFriendStories } = require("../controllers/storyController");
const { uploadStoryMedia } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getStories);
router.get("/friends", getFriendStories);
router.post("/", uploadStoryMedia, createStory);

module.exports = router;
