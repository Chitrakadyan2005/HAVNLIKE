// src/socket.js
import { io } from "socket.io-client";

// Tumhare backend ka URL (local ya deployed)
const SOCKET_URL = "https://girlsgotfeelings-backend.vercel.app"; 

// Build auth payload per tab (session-only to prevent cross-tab identity mixup)
const getAuth = () => ({
  username: sessionStorage.getItem('username') || undefined,
  token: sessionStorage.getItem('token') || undefined
});

// Create socket but do not auto-connect; we'll connect after login/refresh
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  auth: getAuth()
});

// Refresh auth and reconnect so this tab's identity is used
export const refreshSocketAuth = () => {
  socket.auth = getAuth();
  if (socket.connected) socket.disconnect();
  socket.connect();
};

export default socket;
