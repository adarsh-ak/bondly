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

dotenv.config();

const app = express();
const server = http.createServer(app); // 🔥 IMPORTANT
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// ================= SOCKET.IO =================
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Join group room
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });

  // ================= CALL START =================
  socket.on('start_call', ({ groupId, caller, type }) => {
    console.log('📞 Call started');

    socket.to(groupId).emit('incoming_call', {
      groupId,
      caller,
      type, // audio / video
    });
  });

  // ================= ACCEPT =================
  socket.on('accept_call', ({ groupId, user }) => {
    socket.to(groupId).emit('call_accepted', { user });
  });

  // ================= REJECT =================
  socket.on('reject_call', ({ groupId, user }) => {
    socket.to(groupId).emit('call_rejected', { user });
  });

  // ================= END =================
  socket.on('end_call', ({ groupId }) => {
    socket.to(groupId).emit('call_ended');
  });

  // ================= WEBRTC SIGNAL =================
  socket.on('webrtc_signal', ({ groupId, data }) => {
    socket.to(groupId).emit('webrtc_signal', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected');
  });
});

// ================= EXPRESS SETUP =================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

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