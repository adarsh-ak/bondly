import { useEffect, useState, useRef } from "react";
import { messagesAPI } from "../services/api";
import { socket } from "../socket";
import { Send, Users, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Get logged-in user
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  /* ===================== AUTO SCROLL TO BOTTOM ===================== */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ===================== LOAD CONVERSATIONS ===================== */
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await messagesAPI.getConversations();
      console.log("📥 Conversations loaded:", res);
      
      // ✅ Handle different response formats
      const convData = res.conversations || res.data || res;
      setConversations(Array.isArray(convData) ? convData : []);
      
    } catch (err) {
      console.error("❌ Error loading conversations:", err);
      setError("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===================== LOAD MESSAGES WHEN USER SELECTED ===================== */
  const loadMessages = async (user) => {
    if (!user || !user._id) {
      console.error("❌ Invalid user:", user);
      return;
    }

    setSelectedUser(user);
    setMessages([]); // ✅ Clear old messages first
    setError(null);

    try {
      setIsLoading(true);
      console.log("📥 Loading messages for user:", user._id);
      
      const res = await messagesAPI.getMessages(user._id);
      console.log("✅ Messages loaded:", res);
      
      // ✅ Handle different response formats
      const messagesData = res.messages || res.data || res;
      setMessages(Array.isArray(messagesData) ? messagesData : []);

      // ✅ Mark messages as read (optional)
      try {
        await messagesAPI.markAsRead(user._id);
      } catch (err) {
        console.warn("⚠️ Could not mark as read:", err);
      }

    } catch (err) {
      console.error("❌ Error loading messages:", err);
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===================== SEND MESSAGE - FIXED! ===================== */
  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!text.trim() || !selectedUser || isSending) return;

    const messageText = text.trim();
    setText(""); // ✅ Clear input immediately
    setIsSending(true);

    try {
      console.log("📤 Sending message to:", selectedUser._id);
      
      // ✅ FIXED: Use correct API call
      const res = await messagesAPI.sendMessage(
        selectedUser._id,
        messageText,
        "text"
      );

      console.log("✅ Message sent successfully:", res);

      // ✅ Handle response correctly
      if (res && res.success) {
        const newMessage = res.data;

        // ✅ Add to messages immediately
        setMessages((prev) => [...prev, newMessage]);

        // ✅ Emit via socket for real-time
        if (socket?.connected) {
          socket.emit("sendMessage", {
            to: selectedUser._id,
            content: messageText,
            type: "text"
          });
        }

        // ✅ Refresh conversations list
        loadConversations();
      }

    } catch (err) {
      console.error("❌ Error sending message:", err);
      console.error("Error details:", err.response?.data);
      
      // ✅ Restore message on error
      setText(messageText);
      setError(err.response?.data?.message || "Failed to send message");
      
      // ✅ Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
      
    } finally {
      setIsSending(false);
      inputRef.current?.focus(); // ✅ Keep focus on input
    }
  };

  /* ===================== SOCKET RECEIVE MESSAGE REAL-TIME ===================== */
  useEffect(() => {
    if (!socket) {
      console.error("❌ Socket not initialized!");
      return;
    }

    // ✅ Handle incoming messages
    const handleNewMessage = (newMsg) => {
      console.log("📨 New message received:", newMsg);

      // ✅ Only add if from currently selected user
      if (selectedUser && newMsg.sender === selectedUser._id) {
        setMessages((prev) => {
          // ✅ Avoid duplicates
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }

      // ✅ Refresh conversations list
      loadConversations();
    };

    // ✅ Listen to both possible event names
    socket.on("message:receive", handleNewMessage);
    socket.on("newMessage", handleNewMessage);

    // ✅ Cleanup on unmount
    return () => {
      socket.off("message:receive", handleNewMessage);
      socket.off("newMessage", handleNewMessage);
    };
  }, [selectedUser]);

  /* ===================== LOAD ON START ===================== */
  useEffect(() => {
    loadConversations();

    // ✅ Connect socket if not already connected
    if (socket && !socket.connected) {
      socket.connect();
      socket.emit("join", loggedInUser._id || loggedInUser.id);
    }
  }, []);

  /* ===================== HANDLE ENTER KEY ===================== */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ============================================ */}
      {/* LEFT SIDEBAR — CONVERSATIONS LIST */}
      {/* ============================================ */}
      <div className="w-80 border-r overflow-y-auto bg-white shadow-sm">
        
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <h2 className="font-bold text-xl flex items-center gap-2">
            <Users size={24} />
            Chats
          </h2>
          <p className="text-xs opacity-90 mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && !selectedUser && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && conversations.length === 0 && (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-gray-500 font-medium">No chats yet</p>
            <p className="text-sm text-gray-400 mt-1">Start a conversation!</p>
          </div>
        )}

        {/* Conversations List */}
        {conversations.map((c) => {
          const user = c.userDetails;
          if (!user) return null;

          const isActive = selectedUser?._id === user._id;
          const lastMsg = c.lastMessage?.content || "No messages yet";
          const time = c.lastMessage?.createdAt 
            ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            : '';

          return (
            <div
              key={user._id}
              className={`p-4 flex items-start gap-3 cursor-pointer border-b transition-all ${
                isActive 
                  ? "bg-blue-50 border-l-4 border-blue-500" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => loadMessages(user)}
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={user.profilePic || user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'User'}`}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-gray-800 truncate">
                    {user.name || user.fullName || "Unknown"}
                  </p>
                  <span className="text-xs text-gray-500">{time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">
                  {lastMsg}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* RIGHT SIDE CHAT WINDOW */}
      {/* ============================================ */}
      <div className="flex flex-col flex-1">

        {selectedUser ? (
          <>
            {/* HEADER */}
            <div className="p-4 border-b font-semibold bg-white shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.profilePic || selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}`}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-800">
                    {selectedUser.name || selectedUser.fullName || "Unknown"}
                  </p>
                  <p className="text-xs text-green-500">● Online</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  title="Voice Call"
                >
                  <Phone size={20} />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  title="Video Call"
                >
                  <Video size={20} />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  title="More"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mx-4 mt-2">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* CHAT MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
              
              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Messages */}
              {!isLoading && messages.length > 0 && messages.map((msg) => {
                // ✅ FIXED: Correct sender check
                const senderId = msg.sender?._id || msg.sender;
                const myId = loggedInUser._id || loggedInUser.id;
                const isMine = senderId === myId;

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                        isMine
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-white text-gray-800 rounded-bl-sm border"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {!isLoading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-lg">No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation! 💬</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* MESSAGE INPUT */}
            <form onSubmit={sendMessage} className="p-4 border-t flex gap-2 bg-white">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition"
                title="Emoji"
              >
                <Smile size={22} />
              </button>

              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition"
                title="Attach"
              >
                <Paperclip size={22} />
              </button>

              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 border px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSending}
              />

              <button
                type="submit"
                disabled={!text.trim() || isSending}
                className={`px-6 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  text.trim() && !isSending
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          // NO CHAT SELECTED STATE
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <Users size={80} className="mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Welcome to Chat!
              </h2>
              <p className="text-gray-500">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}