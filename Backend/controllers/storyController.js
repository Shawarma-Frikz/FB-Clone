const mongoose = require("mongoose");
const Story = require("../models/Story");
const User = require("../models/User");
const { uploadMediaFromBuffer } = require("../utils/cloudinary");

const getFriendIds = async (userId) => {
  const user = await User.findById(userId).select("friends");

  return user?.friends || [];
};

const createStory = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Story media is required"
      });
    }

    const media = await uploadMediaFromBuffer(req.file, "fb-social/stories", req.file.mimetype.startsWith("video/") ? "video" : "image");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await Story.create({
      user: req.user._id,
      media,
      expiresAt
    });

    const populatedStory = await Story.findById(story._id).populate("user", "name avatar");

    res.status(201).json({
      success: true,
      message: "Story created successfully",
      data: {
        story: populatedStory
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStories = async (req, res, next) => {
  try {
    const friendIds = await getFriendIds(req.user._id);

    const stories = await Story.find({
      user: { $in: friendIds },
      expiresAt: { $gt: new Date() }
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Friend stories fetched successfully",
      data: {
        stories
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFriendStories = async (req, res, next) => {
  try {
    const friendIds = await getFriendIds(req.user._id);

    if (!friendIds.length) {
      return res.status(200).json({
        success: true,
        message: "No friend stories found",
        data: {
          stories: []
        }
      });
    }

    const stories = await Story.find({
      user: { $in: friendIds },
      expiresAt: { $gt: new Date() }
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Friend stories fetched successfully",
      data: {
        stories
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStory,
  getStories,
  getFriendStories
};
