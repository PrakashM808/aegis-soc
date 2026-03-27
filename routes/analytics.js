const express = require('express');
const { Alert, Incident, Threat } = require('../models');
const router = express.Router();

// Get analytics dashboard data
router.get('/', async (req, res) => {
  try {
    const totalAlerts = await Alert.count();
    const criticalAlerts = await Alert.count({ where: { severity: 'CRITICAL' } });
    const highAlerts = await Alert.count({ where: { severity: 'HIGH' } });
    const mediumAlerts = await Alert.count({ where: { severity: 'MEDIUM' } });
    const lowAlerts = await Alert.count({ where: { severity: 'LOW' } });
    
    const openIncidents = await Incident.count({ where: { status: 'open' } });
    const totalThreats = await Threat.count();
    
    res.json({
      alerts: {
        total: totalAlerts,
        critical: criticalAlerts,
        high: highAlerts,
        medium: mediumAlerts,
        low: lowAlerts
      },
      incidents: {
        open: openIncidents
      },
      threats: {
        total: totalThreats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert trends over time
router.get('/trends', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const alerts = await Alert.findAll({
      attributes: ['severity', 'created_at'],
      order: [['created_at', 'ASC']]
    });
    
    // Group by date
    const trends = {};
    alerts.forEach(alert => {
      const date = alert.created_at.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { date, critical: 0, high: 0, medium: 0, low: 0 };
      }
      trends[date][alert.severity.toLowerCase()]++;
    });
    
    res.json(Object.values(trends));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top threat sources
router.get('/top-sources', async (req, res) => {
  try {
    const sources = await Alert.findAll({
      attributes: ['source_ip', [sequelize.fn('COUNT', sequelize.col('source_ip')), 'count']],
      where: { source_ip: { [Op.ne]: null } },
      group: ['source_ip'],
      order: [[sequelize.fn('COUNT', sequelize.col('source_ip')), 'DESC']],
      limit: 10
    });
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
