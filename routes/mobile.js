const express = require('express');
const router = express.Router();

// Get mobile dashboard summary
router.get('/dashboard', (req, res) => {
  const summary = {
    criticalAlerts: 3,
    openIncidents: 5,
    latestThreats: [
      {
        id: 1,
        type: 'malware',
        severity: 'critical',
        timestamp: new Date(),
        description: 'Malware detected on server'
      },
      {
        id: 2,
        type: 'phishing',
        severity: 'high',
        timestamp: new Date(Date.now() - 3600000),
        description: 'Phishing email campaign'
      }
    ],
    systemStatus: 'operational',
    lastSyncTime: new Date()
  };

  res.json({ success: true, data: summary });
});

// Get mobile notifications
router.get('/notifications', (req, res) => {
  const notifications = [
    {
      id: 1,
      title: 'Critical Threat Detected',
      message: 'Malware found on server',
      severity: 'critical',
      timestamp: new Date(),
      read: false
    },
    {
      id: 2,
      title: 'Incident Created',
      message: 'New incident #42 assigned to you',
      severity: 'high',
      timestamp: new Date(Date.now() - 1800000),
      read: false
    }
  ];

  res.json({ success: true, data: notifications });
});

// Mark notification as read
router.put('/notifications/:id/read', (req, res) => {
  res.json({ success: true, message: 'Notification marked as read' });
});

// Get mobile incidents
router.get('/incidents', (req, res) => {
  const incidents = [
    {
      id: 1,
      title: 'Security Incident #1',
      severity: 'critical',
      status: 'open',
      assignedTo: 'Current User',
      createdAt: new Date()
    },
    {
      id: 2,
      title: 'Security Incident #2',
      severity: 'high',
      status: 'inProgress',
      assignedTo: 'Current User',
      createdAt: new Date(Date.now() - 86400000)
    }
  ];

  res.json({ success: true, data: incidents });
});

module.exports = router;
