const express = require('express');
const router = express.Router();

// In-memory storage (replace with DB later)
let incidents = [];
let incidentId = 1;

// Get all incidents
router.get('/', (req, res) => {
  res.json({ success: true, data: incidents });
});

// Get incident by ID
router.get('/:id', (req, res) => {
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }
  res.json({ success: true, data: incident });
});

// Create incident
router.post('/', (req, res) => {
  const { title, description, severity, threatType, assignedTo } = req.body;

  if (!title || !severity) {
    return res.status(400).json({ success: false, message: 'Title and severity required' });
  }

  const incident = {
    id: incidentId++,
    title,
    description,
    severity,
    threatType,
    assignedTo,
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: []
  };

  incidents.push(incident);
  res.status(201).json({ success: true, message: 'Incident created', data: incident });
});

// Update incident
router.put('/:id', (req, res) => {
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  Object.assign(incident, req.body);
  incident.updatedAt = new Date();
  res.json({ success: true, message: 'Incident updated', data: incident });
});

// Delete incident
router.delete('/:id', (req, res) => {
  const index = incidents.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const incident = incidents.splice(index, 1);
  res.json({ success: true, message: 'Incident deleted', data: incident[0] });
});

// Add comment to incident
router.post('/:id/comments', (req, res) => {
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const comment = {
    id: Date.now(),
    text: req.body.text,
    author: req.body.author,
    createdAt: new Date()
  };

  incident.comments.push(comment);
  res.json({ success: true, message: 'Comment added', data: comment });
});

module.exports = router;
