// ============================================
// FILE: socket.js - Frontend Real-time Setup
// ============================================

import { io } from "socket.io-client";

// ✅ Backend WebSocket URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ✅ Create socket instance
export const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Force pure WebSocket (no polling)
  withCredentials: true,     // Allow cookies/credentials
  reconnection: true,        // Enable auto reconnect
  reconnectionAttempts: Infinity, // Keep trying until connected
  reconnectionDelay: 2000,   // 2s delay between retries
  timeout: 20000,            // 20s timeout before giving up on connect
  autoConnect: true,         // Ensure it connects automatically
});

// ============================================
// 🔌 Connection Events
// ============================================

socket.on("connect", () => {
  console.log("🟢 Connected to server:", socket.id);

  // ✅ Auto join user room after connection
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?._id) {
    socket.emit("join", user._id);
    console.log("👤 Joined as user:", user._id);
  }
});

socket.on("disconnect", (reason) => {
  console.warn("🔴 Disconnected from server:", reason);

  if (reason === "io server disconnect") {
    // Manually reconnect if server forced disconnect
    socket.connect();
  }
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

// ============================================
// 📩 Real-time Message Handling
// ============================================

socket.on("newMessage", (message) => {
  console.log("💬 New message received:", message);
  const event = new CustomEvent("socket:newMessage", { detail: message });
  window.dispatchEvent(event);
});

socket.on("userTyping", ({ userId }) => {
  console.log("⌨️ User typing:", userId);
  const event = new CustomEvent("socket:userTyping", { detail: { userId } });
  window.dispatchEvent(event);
});

socket.on("userStatus", ({ userId, status }) => {
  console.log(`🟢 User ${userId} is now ${status}`);
  const event = new CustomEvent("socket:userStatus", { detail: { userId, status } });
  window.dispatchEvent(event);
});

// ============================================
// 📤 Emit Helper Functions
// ============================================

export const sendMessage = (message) => {
  socket.emit("sendMessage", message);
};

export const sendTyping = (toUserId) => {
  socket.emit("typing", { to: toUserId });
};

export const callUser = (data) => {
  socket.emit("call-user", data);
};

export const acceptCall = (data) => {
  socket.emit("accept-call", data);
};

// ============================================
// ✅ Export everything for import in React components
// ============================================
export default socket;
