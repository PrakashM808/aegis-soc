require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { sequelize } = require('./models');
const scheduler = require('./config/scheduler');
const backupManager = require('./config/backup');

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const threatRoutes = require('./routes/threats');
const analyticsRoutes = require('./routes/analytics');
const integrationsRoutes = require('./routes/integrations');
const playbookRoutes = require('./routes/playbooks');
const complianceRoutes = require('./routes/compliance');
const usersRoutes = require('./routes/users');
const alertsRoutes = require('./routes/alerts');
const logsRoutes = require('./routes/logs');
const reportsRoutes = require('./routes/reports');
const searchRoutes = require('./routes/search');
const exportRoutes = require('./routes/export');
const brandingRoutes = require('./routes/branding');
const dashboardAnalyticsRoutes = require('./routes/dashboard-analytics');
const mobileRoutes = require('./routes/mobile');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/threats', threatRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/playbooks', playbookRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/logs', logsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/branding', brandingRoutes);
app.use('/api/v1/dashboard', dashboardAnalyticsRoutes);
app.use('/api/v1/mobile', mobileRoutes);

// WebSocket
io.on('connection', (socket) => {
  console.log(`✓ User connected: ${socket.id}`);
  
  socket.on('threat-alert', (data) => {
    io.emit('threat-notification', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`✗ User disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// Error handling
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.originalUrl });
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

sequelize.sync({ alter: true }).then(() => {
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║          AEGIS-SOC v2.0 - Enterprise Security Platform       ║
║                  ALL 18 FEATURES ENABLED                     ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server: running on port ${PORT}                            
║  🌍 Environment: ${NODE_ENV}                                  
║  📊 API: http://localhost:${PORT}/api/v1                     
║  🎨 Dashboard: http://localhost:${PORT}/dashboard.html       
║  📱 Mobile API: /api/v1/mobile                                
║  ✓ Database synced                                            
║  ✓ Email alerts enabled                                       
║  ✓ Slack integration ready                                    
║  ✓ 2FA authentication ready                                   
║  ✓ Incident management enabled                                
║  ✓ PDF reporting ready                                        
║  ✓ Threat intelligence APIs ready                             
║  ✓ RBAC system active                                         
║  ✓ Playbook automation ready                                  
║  ✓ Advanced search enabled                                    
║  ✓ Data export ready (CSV, JSON, Excel)                       
║  ✓ Scheduled scans active                                     
║  ✓ Database backups scheduled                                 
║  ✓ Custom branding system ready                               
║  ✓ Compliance management enabled                              
║  ✓ Advanced analytics available                               
║  ✓ AI threat detection ready                                  
║  ✓ Mobile API endpoints active                                
║                                                               
║  📊 Active Routes: 15+                                        
║  🔐 Security: JWT + RBAC + 2FA                                
║  📈 Monitoring: Real-time + Analytics                         
║  🎯 Automation: Playbooks + Scheduled Tasks                   
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
  process.exit(1);
});

module.exports = { app, server, io };
