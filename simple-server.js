const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/alerts', (req, res) => {
  res.json([
    { 
      id: 1, 
      title: 'Suspicious Login Attempt', 
      severity: 'HIGH', 
      source_ip: '192.168.1.100', 
      status: 'open', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 2, 
      title: 'Ransomware Detection', 
      severity: 'CRITICAL', 
      source_ip: '10.0.0.5', 
      status: 'open', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 3, 
      title: 'Unusual Network Traffic', 
      severity: 'MEDIUM', 
      source_ip: '45.33.22.11', 
      status: 'open', 
      created_at: new Date().toISOString() 
    }
  ]);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      token: 'test-token-' + Date.now(), 
      user: { id: 1, username: 'admin', role: 'admin' } 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth API is working!' });
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🛡️  AEGIS-SOC API Server');
  console.log('='.repeat(50));
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/aegis-admin-dashboard.html`);
  console.log(`\n🔑 Test Login: admin / admin123`);
  console.log('='.repeat(50) + '\n');
});
