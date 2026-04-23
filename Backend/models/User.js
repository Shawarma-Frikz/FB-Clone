const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  tokenVersion: { type: Number, default: 0 },
  avatar: { type: String, default: "" },
  coverPhoto: { type: String, default: "" },
  bio: { type: String, default: "" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequests: {
    sent: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
    received: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);