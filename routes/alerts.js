const express = require('express');
const { Alert } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    await alert.update({ 
      status: 'acknowledged',
      acknowledged_at: new Date()
    });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
