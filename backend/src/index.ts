import express, { Request, Response, NextFunction } from 'express';
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
import reviewRoutes from './routes/review.routes';
import userRoutes from './routes/user.routes';
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

const PORT = process.env.PORT || 3000;

// Security & Body parsing middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health Check with DB ping
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      service: 'RoomSync Core API',
      version: '2.4.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      service: 'RoomSync Core API',
      database: 'disconnected',
      error: error?.message || 'Database unreachable'
    });
  }
});

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/users', userRoutes);

// Global 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.originalUrl} does not exist.` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Socket.io Real-time Messaging Subsystem
io.on('connection', (socket) => {
  socket.on('join_room', (roomId: string) => {
    if (typeof roomId === 'string' && roomId.length < 100) {
      socket.join(roomId);
    }
  });

  socket.on('send_message', async (data: { roomId: string; senderId: string; content: string }) => {
    try {
      if (!data.content?.trim() || !data.roomId) return;
      
      const isGroup = data.roomId.startsWith('group_');
      const isDirect = data.roomId.startsWith('direct_');
      const rawTargetId = isGroup ? data.roomId.replace('group_', '') : data.roomId.replace('direct_', '');

      // Verify or resolve valid sender
      let sender = data.senderId ? await prisma.user.findUnique({ where: { id: data.senderId } }) : null;
      if (!sender) {
        sender = await prisma.user.findFirst();
      }

      if (sender) {
        let validGroupId = null;
        let validReceiverId = null;

        if (isGroup) {
          const group = await prisma.group.findUnique({ where: { id: rawTargetId } });
          if (group) validGroupId = group.id;
        } else if (isDirect) {
          const receiver = await prisma.user.findUnique({ where: { id: rawTargetId } });
          if (receiver) validReceiverId = receiver.id;
        }

        try {
          const savedMessage = await prisma.message.create({
            data: {
              content: data.content.trim(),
              senderId: sender.id,
              groupId: validGroupId,
              receiverId: validReceiverId,
            },
            include: {
              sender: { select: { id: true, name: true } }
            }
          });

          io.to(data.roomId).emit('receive_message', savedMessage);
          return;
        } catch (dbErr) {
          console.warn('DB create message fallback:', dbErr);
        }
      }

      // Fallback in-memory broadcast if foreign keys are demo or detached
      const fallbackMessage = {
        id: 'msg-' + Date.now(),
        content: data.content.trim(),
        senderId: data.senderId || 'user',
        sender: { id: data.senderId, name: sender?.name || 'You' },
        createdAt: new Date().toISOString()
      };
      io.to(data.roomId).emit('receive_message', fallbackMessage);
    } catch (err) {
      console.error('Socket send_message error:', err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[RoomSync] Server running securely on port ${PORT}`);
});
