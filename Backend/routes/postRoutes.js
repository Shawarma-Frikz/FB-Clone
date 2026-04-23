const express = require("express");
const {
	getPosts,
	createPost,
	likePost,
	addComment,
	deletePost
} = require("../controllers/postController");
const { uploadPostMedia } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getPosts);
router.post("/", uploadPostMedia, createPost);
router.post("/:postId/like", likePost);
router.post("/:postId/comments", addComment);
router.delete("/:postId", deletePost);

module.exports = router;
