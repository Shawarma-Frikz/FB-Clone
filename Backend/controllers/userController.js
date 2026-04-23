const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { uploadImageFromBuffer } = require("../utils/cloudinary");
const { emitNotificationToUser } = require("../sockets/realtime");

const buildUserResponse = (user) => {
  const plainUser = user.toObject ? user.toObject() : user;
  delete plainUser.password;
  return plainUser;
};

const getTargetUserId = (req) => req.params.userId || req.body.userId;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const hasObjectId = (collection, objectId) => collection?.some((id) => id.toString() === objectId);

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const updates = {};
    const { name, bio } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Name must be a string"
        });
      }

      const trimmedName = name.trim();

      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 50 characters"
        });
      }

      updates.name = trimmedName;
    }

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return res.status(400).json({
          success: false,
          message: "Bio must be a string"
        });
      }

      const trimmedBio = bio.trim();

      if (trimmedBio.length > 160) {
        return res.status(400).json({
          success: false,
          message: "Bio cannot exceed 160 characters"
        });
      }

      updates.bio = trimmedBio;
    }

    if (req.files?.avatar?.[0]) {
      updates.avatar = await uploadImageFromBuffer(req.files.avatar[0]);
    }

    if (req.files?.coverPhoto?.[0]) {
      updates.coverPhoto = await uploadImageFromBuffer(req.files.coverPhoto[0]);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const sendFriendRequest = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself"
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    if (hasObjectId(currentUser.friends, targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "You are already friends"
      });
    }

    if (hasObjectId(currentUser.friendRequests?.sent, targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent"
      });
    }

    if (hasObjectId(currentUser.friendRequests?.received, targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "This user has already sent you a friend request"
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, {
        $addToSet: { "friendRequests.sent": targetUser._id }
      }),
      User.findByIdAndUpdate(targetUserId, {
        $addToSet: { "friendRequests.received": req.user._id }
      })
    ]);
    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      type: "friend_request"
    });
    const populatedNotification = await Notification.findById(notification._id).populate("sender", "name avatar");
    emitNotificationToUser(targetUser._id, populatedNotification);

    res.status(200).json({
      success: true,
      message: "Friend request sent successfully"
    });
  } catch (error) {
    next(error);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Invalid friend request"
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    const hasIncomingRequest = hasObjectId(currentUser.friendRequests?.received, targetUserId);

    if (!hasIncomingRequest) {
      return res.status(400).json({
        success: false,
        message: "No pending friend request from this user"
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, {
        $pull: { "friendRequests.received": targetUser._id },
        $addToSet: { friends: targetUser._id }
      }),
      User.findByIdAndUpdate(targetUserId, {
        $pull: { "friendRequests.sent": req.user._id },
        $addToSet: { friends: req.user._id }
      })
    ]);
    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      type: "friend_request_accepted"
    });
    const populatedNotification = await Notification.findById(notification._id).populate("sender", "name avatar");
    emitNotificationToUser(targetUser._id, populatedNotification);

    res.status(200).json({
      success: true,
      message: "Friend request accepted successfully"
    });
  } catch (error) {
    next(error);
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    const hasIncomingRequest = hasObjectId(currentUser.friendRequests?.received, targetUserId);

    if (!hasIncomingRequest) {
      return res.status(400).json({
        success: false,
        message: "No pending friend request from this user"
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, {
        $pull: { "friendRequests.received": targetUser._id }
      }),
      User.findByIdAndUpdate(targetUserId, {
        $pull: { "friendRequests.sent": req.user._id }
      })
    ]);

    res.status(200).json({
      success: true,
      message: "Friend request rejected successfully"
    });
  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const targetUserId = getTargetUserId(req);

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    const isFriend = hasObjectId(currentUser.friends, targetUserId);

    if (!isFriend) {
      return res.status(400).json({
        success: false,
        message: "This user is not in your friend list"
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, {
        $pull: { friends: targetUser._id }
      }),
      User.findByIdAndUpdate(targetUserId, {
        $pull: { friends: req.user._id }
      })
    ]);

    res.status(200).json({
      success: true,
      message: "Friend removed successfully"
    });
  } catch (error) {
    next(error);
  }
};

const getFriendList = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate("friends", "name avatar bio coverPhoto");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Friend list fetched successfully",
      data: {
        friends: user.friends
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserProfile,
  updateUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendList
};
