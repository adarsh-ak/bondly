import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import flagRoutes from './routes/flags.js';
import connectDB from './config/db.js';

import messageRoutes from './routes/messages.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import dashboardRoutes from './routes/dashboard.js';
import groupRoutes from './routes/groups.js';
import eventRoutes from './routes/events.js';
import postRoutes from './routes/posts.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const server = http.createServer(app); // 🔥 IMPORTANT
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

// ================= GROUP CALL STATE =================
// groupId -> Map(socketId -> { user, callType, audioEnabled, videoEnabled })
const activeCalls = new Map();

// socketId -> groupId (taaki disconnect par pata chale ye kis call mein tha)
const socketToCallGroup = new Map();

// groupId -> socketId jisne sabse pehle call join ki thi (call ka "host")
// - jab ye banda call chhode, sabke liye call khatam ho jaati hai
const callInitiators = new Map();

// groupId -> { type, callerId, callerUser, startedAt, answered } - missed call
// / call log feature ke liye (WhatsApp jaisa "Missed call" / "Voice call · 2:15")
const callMeta = new Map();

const getCallParticipants = (groupId) => {
  const call = activeCalls.get(groupId);
  if (!call) return [];
  return Array.from(call.entries()).map(([socketId, info]) => ({
    socketId,
    ...info,
  }));
};

// call poori tarah khatam hone par ek chat message ki tarah call-log save karo
// - "Missed call" agar koi answer hi nahi kar paaya, warna duration ke saath
const finalizeCallLog = async (io, groupId) => {
  const meta = callMeta.get(groupId);
  if (!meta) return;
  callMeta.delete(groupId);

  const durationSec = Math.max(0, Math.round((Date.now() - meta.startedAt) / 1000));
  const status = meta.answered ? 'completed' : 'missed';

  try {
    const message = await Message.create({
      sender: meta.callerId,
      group: groupId,
      content: JSON.stringify({ callType: meta.type, status, duration: durationSec }),
      type: 'call',
      read: false,
    });
    const populated = await message.populate('sender', 'name username avatar');
    io.to(groupId).emit('new_message', populated);
  } catch (err) {
    console.error('call log save error:', err.message);
  }
};

// ================= SOCKET.IO =================
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Join group room (chat ke liye)
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });

  // ================= SEND MESSAGE (REAL-TIME) =================
  socket.on('send_message', async ({ groupId, senderId, content, type = 'text', imageUrl = null, fileName = null }) => {
    try {
      const message = await Message.create({
        sender: senderId,
        group: groupId,
        content: content?.trim() || '',
        type,
        imageUrl,
        fileName,
        read: false,
      });
      const populated = await message.populate('sender', 'name username avatar');
      io.to(groupId).emit('new_message', populated);
    } catch (err) {
      console.error('send_message error:', err.message);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // ================= REACT TO MESSAGE =================
  socket.on('react_message', async ({ messageId, groupId, userId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const existingIndex = message.reactions.findIndex(
        (r) => r.user.toString() === userId
      );

      if (existingIndex !== -1) {
        if (message.reactions[existingIndex].emoji === emoji) {
          message.reactions.splice(existingIndex, 1);
        } else {
          message.reactions[existingIndex].emoji = emoji;
        }
      } else {
        message.reactions.push({ user: userId, emoji });
      }

      await message.save();

      const populated = await message.populate('sender', 'name username avatar');
      io.to(groupId).emit('message_reaction_updated', populated);
    } catch (err) {
      console.error('react_message error:', err.message);
    }
  });

  // ================= DELETE MESSAGE (for everyone) =================
  socket.on('delete_message', async ({ messageId, groupId }) => {
    try {
      await Message.findByIdAndDelete(messageId);
      io.to(groupId).emit('message_deleted', { messageId });
    } catch (err) {
      console.error('delete_message error:', err.message);
    }
  });

  // ================= POLL =================
  socket.on('create_poll', async ({ groupId, senderId, question, options, allowMultiple = false }) => {
    try {
      if (!question?.trim() || !Array.isArray(options)) return;
      const cleanOptions = options.map((o) => o?.trim()).filter(Boolean);
      if (cleanOptions.length < 2) return;

      const message = await Message.create({
        sender: senderId,
        group: groupId,
        type: 'poll',
        content: '',
        poll: {
          question: question.trim(),
          options: cleanOptions.map((text) => ({ text, votes: [] })),
          allowMultiple,
        },
        read: false,
      });

      const populated = await message.populate('sender', 'name username avatar');
      io.to(groupId).emit('new_message', populated);
    } catch (err) {
      console.error('create_poll error:', err.message);
    }
  });

  socket.on('vote_poll', async ({ messageId, groupId, userId, optionIndex }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.type !== 'poll') return;
      if (!message.poll?.options?.[optionIndex]) return;

      const { poll } = message;
      const alreadyVotedIndex = poll.options.findIndex((opt) =>
        opt.votes.some((v) => v.toString() === userId)
      );

      if (!poll.allowMultiple) {
        if (alreadyVotedIndex !== -1) {
          poll.options[alreadyVotedIndex].votes = poll.options[alreadyVotedIndex].votes.filter(
            (v) => v.toString() !== userId
          );
        }
        if (alreadyVotedIndex !== optionIndex) {
          poll.options[optionIndex].votes.push(userId);
        }
      } else {
        const idx = poll.options[optionIndex].votes.findIndex((v) => v.toString() === userId);
        if (idx !== -1) {
          poll.options[optionIndex].votes.splice(idx, 1);
        } else {
          poll.options[optionIndex].votes.push(userId);
        }
      }

      message.markModified('poll');
      await message.save();

      const populated = await message.populate('sender', 'name username avatar');
      io.to(groupId).emit('message_reaction_updated', populated);
    } catch (err) {
      console.error('vote_poll error:', err.message);
    }
  });

  // ================================================================
  // ======================= GROUP CALLS ============================
  // ================================================================
  // Mesh architecture: har participant baaki sab participants se
  // directly (peer-to-peer) connect hota hai. Server sirf signaling
  // (offer/answer/ice candidates) relay karta hai — media kabhi
  // server se hokar nahi jaata.

  // ---------- 1. RING: group ke baaki members ko batao ki call shuru hui ----------
  socket.on('start_call', ({ groupId, caller, type }) => {
    console.log(`📞 ${type} call started in group ${groupId} by`, caller?.username);

    callMeta.set(groupId, {
      type,
      callerId: caller?.id || caller?._id,
      callerUser: caller,
      startedAt: Date.now(),
      answered: false,
    });

    socket.to(groupId).emit('incoming_call', {
      groupId,
      caller,
      type, // 'audio' | 'video'
    });
  });

  // agar koi call ko reject kare (call connect hone se pehle)
  socket.on('reject_call', ({ groupId, user }) => {
    socket.to(groupId).emit('call_rejected', { user });
  });

  // ---------- 2. JOIN: user call mein actually shaamil ho raha hai ----------
  socket.on('join_call', ({ groupId, user, callType }) => {
    if (!groupId || !user) return;

    socket.join(`call:${groupId}`);
    socketToCallGroup.set(socket.id, groupId);

    if (!activeCalls.has(groupId)) {
      activeCalls.set(groupId, new Map());
      // sabse pehla joiner hi is call ka "host"/initiator hai
      callInitiators.set(groupId, socket.id);
    }
    const call = activeCalls.get(groupId);

    // pehle se call mein maujood logo ki list is naye joiner ko bhejo
    // (naya joiner hi inn sabko offer bhejega - mesh setup)
    const existingParticipants = getCallParticipants(groupId);
    socket.emit('call_participants', { participants: existingParticipants });

    // ab isko list mein add karo
    call.set(socket.id, {
      user,
      callType,
      audioEnabled: true,
      videoEnabled: callType === 'video',
    });

    // agar ab call mein 1 se zyada log ho gaye hain, matlab kisi ne isse
    // "answer" kar diya hai - missed call nahi ginenge ise
    if (call.size > 1) {
      const meta = callMeta.get(groupId);
      if (meta) meta.answered = true;
    }

    // baaki sabko batao ki ye naya banda aaya hai (wo iska wait karenge,
    // offer naya banda hi bhejega)
    socket.to(`call:${groupId}`).emit('call_user_joined', {
      socketId: socket.id,
      user,
      callType,
    });

    console.log(`👤 ${user?.username} joined call in group ${groupId} (${call.size} total)`);
  });

  // ---------- 3. SIGNALING RELAY (targeted - kisi ek specific socket ko) ----------
  socket.on('webrtc_offer', ({ targetSocketId, offer, fromUser }) => {
    io.to(targetSocketId).emit('webrtc_offer', {
      fromSocketId: socket.id,
      offer,
      fromUser,
    });
  });

  socket.on('webrtc_answer', ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit('webrtc_answer', {
      fromSocketId: socket.id,
      answer,
    });
  });

  socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('webrtc_ice_candidate', {
      fromSocketId: socket.id,
      candidate,
    });
  });

  // ---------- 4. MUTE / CAMERA TOGGLE STATE (taaki UI par sabko pata chale) ----------
  socket.on('call_media_toggle', ({ groupId, audioEnabled, videoEnabled }) => {
    const call = activeCalls.get(groupId);
    if (!call || !call.has(socket.id)) return;

    const info = call.get(socket.id);
    if (typeof audioEnabled === 'boolean') info.audioEnabled = audioEnabled;
    if (typeof videoEnabled === 'boolean') info.videoEnabled = videoEnabled;
    call.set(socket.id, info);

    socket.to(`call:${groupId}`).emit('call_media_toggle', {
      socketId: socket.id,
      audioEnabled: info.audioEnabled,
      videoEnabled: info.videoEnabled,
    });
  });

  // ---------- 5. LEAVE CALL ----------
  const handleLeaveCall = (groupId) => {
    if (!groupId) return;
    const call = activeCalls.get(groupId);
    const wasInitiator = callInitiators.get(groupId) === socket.id;

    if (wasInitiator) {
      // jisne call start ki thi wahi nikal gaya - sabke liye call turant
      // khatam kar do (jaise WhatsApp/Zoom mein host call end kare to)
      activeCalls.delete(groupId);
      callInitiators.delete(groupId);
      io.to(groupId).emit('call_ended');
      finalizeCallLog(io, groupId);
      console.log(`📴 call initiator left - call ended for everyone in group ${groupId}`);
    } else {
      if (call && call.has(socket.id)) {
        call.delete(socket.id);
        if (call.size === 0) {
          activeCalls.delete(groupId);
          callInitiators.delete(groupId);
          // koi bhi ab call mein nahi bacha - jinhe abhi tak "ring" dikh rahi thi
          // unka bhi popup band karo
          io.to(groupId).emit('call_ended');
          finalizeCallLog(io, groupId);
        }
      }
      socket.to(`call:${groupId}`).emit('call_user_left', { socketId: socket.id });
    }

    socket.leave(`call:${groupId}`);
    socketToCallGroup.delete(socket.id);
    console.log(`👋 ${socket.id} left call in group ${groupId}`);
  };

  socket.on('leave_call', ({ groupId }) => {
    handleLeaveCall(groupId);
  });

  // agar caller/koi bhi "end_call" bheje (poori call sabke liye khatam - optional legacy support)
  socket.on('end_call', ({ groupId }) => {
    socket.to(groupId).emit('call_ended');
  });

  // ================================================================

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);

    // agar ye user kisi active call mein tha, to usse bhi cleanly nikaalo
    const groupId = socketToCallGroup.get(socket.id);
    if (groupId) {
      handleLeaveCall(groupId);
    }
  });
});

// ================= EXPRESS SETUP =================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/flags', flagRoutes);

// HEALTH
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});