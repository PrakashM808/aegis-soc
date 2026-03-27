/**
 * AEGIS-SOC API - Main Server
 * Enterprise Cybersecurity Platform Backend
 */

require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const rateLimit = require('express-rate-limit');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logger');
const authentication = require('./middleware/authentication');

// Import routes
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const threatRoutes = require('./routes/threats');
const analyticsRoutes = require('./routes/analytics');
const integrationsRoutes = require('./routes/integrations');
const playbookRoutes = require('./routes/playbooks');
const complianceRoutes = require('./routes/compliance');
const usersRoutes = require('./routes/users');
const alertsRoutes = require('./routes/alerts');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging
app.use(morgan(process.env.LOG_FORMAT || 'combined'));
app.use(requestLogger);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidents', authentication, incidentRoutes);
app.use('/api/v1/threats', authentication, threatRoutes);
app.use('/api/v1/analytics', authentication, analyticsRoutes);
app.use('/api/v1/integrations', authentication, integrationsRoutes);
app.use('/api/v1/playbooks', authentication, playbookRoutes);
app.use('/api/v1/compliance', authentication, complianceRoutes);
app.use('/api/v1/users', authentication, usersRoutes);
app.use('/api/v1/alerts', authentication, alertsRoutes);

// WebSocket Events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Real-time threat notifications
  socket.on('subscribe_threats', (data) => {
    socket.join(`threats_${data.organizationId}`);
  });

  // Real-time incident updates
  socket.on('subscribe_incidents', (data) => {
    socket.join(`incidents_${data.organizationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use(errorHandler);

// Database Connection
const db = require('./config/database');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start Server
(async () => {
  try {
    // Test database connection
    await db.authenticate();
    console.log('✓ Database connection established');

    // Sync models
    await db.sync({ alter: NODE_ENV === 'development' });
    console.log('✓ Database models synchronized');

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║        AEGIS-SOC API - Enterprise Security Platform    ║
║                                                        ║
║  🚀 Server running on port ${PORT}                      
║  🌍 Environment: ${NODE_ENV}                           
║  📊 API: http://localhost:${PORT}/api/v1              
║  📡 WebSocket: ws://localhost:${PORT}                  
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await db.close();
        console.log('✓ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();

module.exports = { app, server, io };
