const express = require('express');
const { Threat } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const threats = await Threat.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(threats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const threat = await Threat.create(req.body);
    res.status(201).json(threat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
