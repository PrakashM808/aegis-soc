const express = require('express');
const router = express.Router();

// Get dashboard metrics
router.get('/metrics', (req, res) => {
  const metrics = {
    totalThreats: 1234,
    criticalThreats: 12,
    incidentsOpen: 4,
    incidentsClosed: 156,
    mttr: '2.5 hours',
    detectionRate: '99.8%',
    falsePositives: '0.2%',
    usersActive: 24,
    logsAnalyzed: '2.5M',
    apiCalls: '45K'
  };

  res.json({ success: true, data: metrics });
});

// Get threat trends
router.get('/threat-trends', (req, res) => {
  const trends = {
    daily: [
      { date: '2024-01-01', count: 15 },
      { date: '2024-01-02', count: 18 },
      { date: '2024-01-03', count: 22 },
      { date: '2024-01-04', count: 19 },
      { date: '2024-01-05', count: 25 },
      { date: '2024-01-06', count: 28 },
      { date: '2024-01-07', count: 31 }
    ],
    byType: {
      malware: 45,
      phishing: 25,
      intrusion: 18,
      exfiltration: 12
    }
  };

  res.json({ success: true, data: trends });
});

// Get incident metrics
router.get('/incident-metrics', (req, res) => {
  const metrics = {
    bySeverity: {
      critical: 2,
      high: 5,
      medium: 15,
      low: 25
    },
    byStatus: {
      open: 4,
      inProgress: 8,
      resolved: 35,
      closed: 121
    },
    avgResolutionTime: '12 hours',
    sla: '98%'
  };

  res.json({ success: true, data: metrics });
});

module.exports = router;
