require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimit');

// Routes
const chatRoutes = require('./src/routes/chat');
const memoryRoutes = require('./src/routes/memory');
const voiceRoutes = require('./src/routes/voice');
const healthRoutes = require('./src/routes/health');

// WebSocket service
const wsService = require('./src/services/wsService');

const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });
wsService.init(wss);

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/voice', voiceRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🎙️  VoiceAI Backend running on port ${PORT}`);
  logger.info(`🔌  WebSocket server ready at ws://localhost:${PORT}/ws`);
  logger.info(`🌍  Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, server };
