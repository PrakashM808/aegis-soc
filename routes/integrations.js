const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ integrations: [], message: "Integrations endpoint ready" });
});

router.post('/', async (req, res) => {
  res.status(201).json({ message: "Integration created" });
});

module.exports = router;
