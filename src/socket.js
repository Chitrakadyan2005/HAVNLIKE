import { io } from "socket.io-client";

const SOCKET_URL = "https://girlsgotfeelings-backend.onrender.com/"; 

const getAuth = () => ({
  username: sessionStorage.getItem('username') || undefined,
  token: sessionStorage.getItem('token') || undefined
});

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  auth: getAuth()
});

export const refreshSocketAuth = () => {
  socket.auth = getAuth();
  if (socket.connected) socket.disconnect();
  socket.connect();
};

export default socket;
