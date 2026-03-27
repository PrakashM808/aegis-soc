const express = require('express');
const router = express.Router();

// Sample data storage
const threatDatabase = [
  { id: 1, type: 'malware', ip: '192.168.1.100', severity: 'critical', timestamp: new Date() },
  { id: 2, type: 'phishing', email: 'attacker@evil.com', severity: 'high', timestamp: new Date() },
  { id: 3, type: 'intrusion', ip: '10.0.0.50', severity: 'medium', timestamp: new Date() }
];

// Advanced search
router.post('/threats', (req, res) => {
  const { query, filters, sortBy, limit, offset } = req.body;

  try {
    let results = [...threatDatabase];

    // Full-text search
    if (query) {
      results = results.filter(threat => 
        JSON.stringify(threat).toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters
    if (filters) {
      if (filters.severity) {
        results = results.filter(t => t.severity === filters.severity);
      }
      if (filters.type) {
        results = results.filter(t => t.type === filters.type);
      }
      if (filters.dateRange) {
        results = results.filter(t => 
          t.timestamp >= new Date(filters.dateRange.start) && 
          t.timestamp <= new Date(filters.dateRange.end)
        );
      }
    }

    // Sort
    if (sortBy) {
      results.sort((a, b) => {
        if (sortBy.field === 'timestamp') {
          return sortBy.order === 'asc' ? 
            new Date(a.timestamp) - new Date(b.timestamp) :
            new Date(b.timestamp) - new Date(a.timestamp);
        }
        return 0;
      });
    }

    // Pagination
    const start = offset || 0;
    const end = start + (limit || 10);
    const paginated = results.slice(start, end);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total: results.length,
        limit: limit || 10,
        offset: start
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save search
router.post('/save-search', (req, res) => {
  const { name, query, filters } = req.body;

  const savedSearch = {
    id: Date.now(),
    name,
    query,
    filters,
    createdAt: new Date()
  };

  res.json({ success: true, message: 'Search saved', data: savedSearch });
});

// Get search history
router.get('/history', (req, res) => {
  const history = [
    { query: 'malware', timestamp: new Date() },
    { query: 'critical threats', timestamp: new Date(Date.now() - 3600000) },
    { query: '192.168.1.100', timestamp: new Date(Date.now() - 7200000) }
  ];

  res.json({ success: true, data: history });
});

module.exports = router;
