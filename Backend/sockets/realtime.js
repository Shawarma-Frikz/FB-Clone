let ioInstance = null;
const onlineUsers = new Map();

const setSocketServer = (io) => {
  ioInstance = io;
};

const setOnlineUser = (userId, socketId) => {
  if (!userId || !socketId) {
    return;
  }

  onlineUsers.set(userId.toString(), socketId);
};

const removeOnlineUser = (userId, socketId) => {
  if (!userId) {
    return;
  }

  const key = userId.toString();
  const existingSocketId = onlineUsers.get(key);

  if (!socketId || existingSocketId === socketId) {
    onlineUsers.delete(key);
  }
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const getRecipientSocket = (userId) => onlineUsers.get(userId?.toString());

const emitNotificationToUser = (userId, payload) => {
  const recipientSocketId = getRecipientSocket(userId);

  if (!ioInstance || !recipientSocketId) {
    return;
  }

  ioInstance.to(recipientSocketId).emit("notification:new", payload);
};

module.exports = {
  setSocketServer,
  setOnlineUser,
  removeOnlineUser,
  getOnlineUserIds,
  getRecipientSocket,
  emitNotificationToUser
};
