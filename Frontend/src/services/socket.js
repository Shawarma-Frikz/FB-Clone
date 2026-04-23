import { io } from "socket.io-client";
import { readAuthStorage } from "./authStorage";

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") || "http://localhost:5000";

let socket;

export const getSocket = (token) => {
  const resolvedToken = token || readAuthStorage()?.accessToken;

  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      auth: {
        token: resolvedToken
      }
    });
  }

  if (resolvedToken) {
    socket.auth = { token: resolvedToken };
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};