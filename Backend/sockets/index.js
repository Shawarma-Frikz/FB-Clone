const { Server } = require("socket.io");
const User = require("../models/User");
const { verifyAccessToken } = require("../utils/tokenUtils");
const {
  createAndStoreMessage,
  markMessageSeen
} = require("../utils/chatService");
const {
  getOnlineUserIds,
  getRecipientSocket,
  removeOnlineUser,
  setOnlineUser,
  setSocketServer
} = require("./realtime");

const emitOnlineUsers = async (io) => {
  const userIds = getOnlineUserIds();

  if (!userIds.length) {
    io.emit("users:online", []);
    return;
  }

  const users = await User.find({ _id: { $in: userIds } }).select("name avatar");

  io.emit(
    "users:online",
    users.map((user) => ({
      _id: user._id,
      name: user.name,
      avatar: user.avatar
    }))
  );
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "*",
      credentials: true
    }
  });
  setSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select("-password");

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        return next(new Error("Invalid authentication token"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    setOnlineUser(userId, socket.id);

    await emitOnlineUsers(io);

    socket.on("conversation:join", ({ userId: otherUserId }) => {
      if (!otherUserId) {
        return;
      }

      socket.join([userId, otherUserId].sort().join(":"));
    });

    socket.on("typing", ({ receiverId }) => {
      const recipientSocketId = getRecipientSocket(receiverId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing", { userId });
      }
    });

    socket.on("stop-typing", ({ receiverId }) => {
      const recipientSocketId = getRecipientSocket(receiverId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("stop-typing", { userId });
      }
    });

    socket.on("message:send", async (payload, callback) => {
      try {
        const message = await createAndStoreMessage({
          senderId: socket.user._id,
          receiverId: payload.receiverId,
          text: payload.text,
          attachment: payload.attachment || null
        });

        const responsePayload = { message };
        const recipientSocketId = getRecipientSocket(payload.receiverId);

        socket.emit("message:new", responsePayload);

        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message:new", responsePayload);
        }

        if (typeof callback === "function") {
          callback({ success: true, data: responsePayload });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ success: false, message: error.message });
        }
      }
    });

    socket.on("message:seen", async ({ messageId }, callback) => {
      try {
        const message = await markMessageSeen({ messageId, userId: socket.user._id });

        if (message) {
          const recipientSocketId = getRecipientSocket(message.sender._id);

          if (recipientSocketId) {
            io.to(recipientSocketId).emit("message:seen", {
              messageId: message._id,
              seen: true,
              by: socket.user._id
            });
          }
        }

        if (typeof callback === "function") {
          callback({ success: true, data: { message } });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ success: false, message: error.message });
        }
      }
    });

    socket.on("disconnect", async () => {
      removeOnlineUser(userId, socket.id);
      await emitOnlineUsers(io);
    });
  });

  return io;
};

module.exports = {
  initSocket
};