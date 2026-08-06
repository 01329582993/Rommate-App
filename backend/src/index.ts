import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import matchRoutes from './routes/match.routes';
import adminRoutes from './routes/admin.routes';
import groupRoutes from './routes/group.routes';
import messageRoutes from './routes/message.routes';
import prisma from './utils/prisma';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.includes('/api/groups')) {
    console.log(`[${req.method}] ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoomSync API is running with Socket.io' });
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    // data: { roomId, senderId, content, receiverId? }
    // Save to database
    try {
      const savedMessage = await prisma.message.create({
        data: {
          content: data.content,
          senderId: data.senderId,
          groupId: data.roomId.startsWith('group_') ? data.roomId.replace('group_', '') : null,
          receiverId: data.roomId.startsWith('direct_') ? data.roomId.replace('direct_', '') : null,
        },
        include: {
          sender: { select: { id: true, name: true } }
        }
      });
      // Broadcast to room
      io.to(data.roomId).emit('receive_message', savedMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
