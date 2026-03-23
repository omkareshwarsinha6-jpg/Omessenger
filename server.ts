import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'omessenger_secret_key_123';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Initialize Database
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      avatarURL TEXT,
      isOnline BOOLEAN DEFAULT 0,
      lastSeen DATETIME,
      isAdmin BOOLEAN DEFAULT 0,
      isBanned BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chatId TEXT,
      senderId TEXT,
      receiverId TEXT,
      content TEXT,
      contentType TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      isRead BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      userA TEXT,
      userB TEXT,
      status TEXT, -- 'pending', 'accepted', 'blocked'
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substring(2, 15);
    
    try {
      await db.run(
        'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
        [id, username, email, hashedPassword]
      );
      const token = jwt.sign({ id, username, email }, JWT_SECRET);
      res.json({ token, user: { id, username, email } });
    } catch (err: any) {
      res.status(400).json({ error: 'User already exists or invalid data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
  });

  // User Routes
  app.get('/api/users/me', authenticate, async (req: any, res) => {
    const user = await db.get('SELECT id, username, email, avatarURL, isAdmin, isBanned FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  });

  app.get('/api/users/search', authenticate, async (req: any, res) => {
    const { q } = req.query;
    const users = await db.all('SELECT id, username, avatarURL FROM users WHERE username LIKE ? AND id != ? LIMIT 10', [`%${q}%`, req.user.id]);
    res.json(users);
  });

  // Chat Routes
  app.get('/api/messages/:chatId', authenticate, async (req: any, res) => {
    const messages = await db.all('SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC', [req.params.chatId]);
    res.json(messages);
  });

  // Socket.io logic
  const userSockets = new Map();

  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      userSockets.set(userId, socket.id);
      db.run('UPDATE users SET isOnline = 1 WHERE id = ?', [userId]);
      io.emit('userStatus', { userId, isOnline: true });
    });

    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, content, contentType } = data;
      const chatId = [senderId, receiverId].sort().join('_');
      const messageId = Math.random().toString(36).substring(2, 15);
      
      await db.run(
        'INSERT INTO messages (id, chatId, senderId, receiverId, content, contentType) VALUES (?, ?, ?, ?, ?, ?)',
        [messageId, chatId, senderId, receiverId, content, contentType]
      );

      const message = { id: messageId, chatId, senderId, receiverId, content, contentType, timestamp: new Date() };
      
      // Send to receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', message);
      }
      
      // Send back to sender
      socket.emit('messageSent', message);
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          db.run('UPDATE users SET isOnline = 0, lastSeen = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
          io.emit('userStatus', { userId, isOnline: false });
          break;
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
