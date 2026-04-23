const mongoose = require("mongoose");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { uploadImageFromBuffer } = require("../utils/cloudinary");
const { emitNotificationToUser } = require("../sockets/realtime");

const buildPostResponse = async (post) => {
  const populatedPost = await Post.populate(post, [
    { path: "user", select: "name avatar" },
    { path: "comments.user", select: "name avatar" },
    { path: "likes", select: "name avatar" }
  ]);

  return populatedPost;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate("user", "name avatar")
      .populate("comments.user", "name avatar")
      .populate("likes", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: {
        posts
      }
    });
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const files = req.files || [];

    if (!content && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Post content or media is required"
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Post content cannot exceed 5000 characters"
      });
    }

    const media = [];

    for (const file of files) {
      media.push(await uploadImageFromBuffer(file, "fb-social/posts"));
    }

    const post = await Post.create({
      user: req.user._id,
      content,
      media
    });

    const author = await User.findById(req.user._id).select("friends");
    const recipients = (author?.friends || []).filter((id) => id.toString() !== req.user._id.toString());

    if (recipients.length) {
      const notifications = await Notification.insertMany(
        recipients.map((recipientId) => ({
          recipient: recipientId,
          sender: req.user._id,
          type: "new_post",
          post: post._id
        }))
      );
      notifications.forEach((notification) => emitNotificationToUser(notification.recipient, notification));
    }

    const populatedPost = await buildPostResponse(post);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        post: populatedPost
      }
    });
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id"
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === req.user._id.toString());

    if (alreadyLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.addToSet(req.user._id);
    }

    await post.save();

    if (!alreadyLiked && post.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: "post_like",
        post: post._id
      });
      const populatedNotification = await Notification.findById(notification._id).populate("sender", "name avatar");
      emitNotificationToUser(post.user, populatedNotification);
    }

    const populatedPost = await buildPostResponse(post);

    res.status(200).json({
      success: true,
      message: alreadyLiked ? "Post unliked successfully" : "Post liked successfully",
      data: {
        post: populatedPost
      }
    });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id"
      });
    }

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    if (text.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 300 characters"
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    post.comments.push({
      user: req.user._id,
      text
    });

    await post.save();

    if (post.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: "post_comment",
        post: post._id
      });
      const populatedNotification = await Notification.findById(notification._id).populate("sender", "name avatar");
      emitNotificationToUser(post.user, populatedNotification);
    }

    const populatedPost = await buildPostResponse(post);

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        post: populatedPost
      }
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id"
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post"
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  likePost,
  addComment,
  deletePost
};
