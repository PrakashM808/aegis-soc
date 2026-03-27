const express = require('express');
const router = express.Router();

let playbooks = [];
let playbookId = 1;

// Get all playbooks
router.get('/', (req, res) => {
  res.json({ success: true, data: playbooks });
});

// Create playbook
router.post('/', (req, res) => {
  const { name, description, trigger, actions, enabled } = req.body;

  if (!name || !trigger || !actions) {
    return res.status(400).json({ success: false, message: 'Name, trigger, and actions required' });
  }

  const playbook = {
    id: playbookId++,
    name,
    description,
    trigger,
    actions,
    enabled: enabled || true,
    createdAt: new Date(),
    executionCount: 0,
    lastExecuted: null
  };

  playbooks.push(playbook);
  res.status(201).json({ success: true, message: 'Playbook created', data: playbook });
});

// Execute playbook
router.post('/:id/execute', (req, res) => {
  const playbook = playbooks.find(p => p.id === parseInt(req.params.id));
  if (!playbook) {
    return res.status(404).json({ success: false, message: 'Playbook not found' });
  }

  if (!playbook.enabled) {
    return res.status(400).json({ success: false, message: 'Playbook is disabled' });
  }

  try {
    // Execute actions
    const results = playbook.actions.map(action => ({
      action: action.type,
      status: 'executed',
      result: `${action.type} executed successfully`
    }));

    playbook.executionCount++;
    playbook.lastExecuted = new Date();

    res.json({ 
      success: true, 
      message: 'Playbook executed', 
      data: {
        playbookId: playbook.id,
        executedActions: results,
        executionTime: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update playbook
router.put('/:id', (req, res) => {
  const playbook = playbooks.find(p => p.id === parseInt(req.params.id));
  if (!playbook) {
    return res.status(404).json({ success: false, message: 'Playbook not found' });
  }

  Object.assign(playbook, req.body);
  res.json({ success: true, message: 'Playbook updated', data: playbook });
});

// Delete playbook
router.delete('/:id', (req, res) => {
  const index = playbooks.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Playbook not found' });
  }

  const playbook = playbooks.splice(index, 1);
  res.json({ success: true, message: 'Playbook deleted', data: playbook[0] });
});

module.exports = router;
