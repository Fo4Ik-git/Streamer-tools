import { io } from "socket.io-client";

// In production, '/' connects to the same host/port serving the page
// In development with Vite proxy, it also goes to '/' which proxies to backend
export const socket = io("/", {
  transports: ["websocket", "polling"],
});
